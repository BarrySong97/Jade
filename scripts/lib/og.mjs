/**
 * @purpose 抓取并解析外部网页的 OG 元数据:标题 / 描述 / og:image / favicon,以及 URL 归一化。
 * @role    被 scripts/link-card.mjs 调用;纯网络+字符串解析(不落盘、不上传),产出写入 src/data/link-cards.json 所需的原始信息。
 * @deps    全局 fetch(Node 18+);无 DOM 解析依赖,正则扫 <meta>/<link>/<title>
 * @gotcha  归一化 URL 是缓存 key 的唯一定义,改这里等于改缓存格式(旧 key 会失配,需 --refresh 重抓)。抓取带 UA 与 10s 超时;解析失败一律返回 null 而非抛错,让调用方决定降级。详见 docs/topics/link-cards.md
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TIMEOUT_MS = 10_000;

// 追踪参数:归一化时一律剔除,避免同一篇文章因来源不同产生多条缓存
const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_[ce]id$|ref$|ref_src$|spm$|from$|s$)/i;

/**
 * URL 归一化 —— 缓存 key 的唯一定义。
 * 小写 scheme/host、去 www.、去追踪参数、去 fragment、去尾斜杠(根路径除外)。
 * @param {string} raw
 * @returns {string}
 */
export function normalizeUrl(raw) {
  const u = new URL(raw.trim());
  u.protocol = u.protocol.toLowerCase();
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  u.hash = "";
  // 先快照 key 再删:searchParams.keys() 是活的迭代器,边遍历边 delete 会漏掉相邻项
  const keys = Array.from(u.searchParams.keys());
  for (const key of keys) {
    if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  }
  u.search = u.searchParams.toString() ? `?${u.searchParams}` : "";
  if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.replace(/\/+$/, "");
  const out = u.toString();
  return u.pathname === "/" && !u.search ? out.replace(/\/$/, "") : out;
}

/** 展示用域名:去掉 scheme 与 www.。 */
export function displayDomain(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

// 有的站(实测 Vercel 上的 SPA)对 `Accept: */*` 直接回 500,换成浏览器那套 Accept 才给 200,
// 所以这里连 Accept / Accept-Language 一起伪装,别只带 UA
const ACCEPT_HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const ACCEPT_IMAGE = "image/avif,image/webp,image/apng,image/*,*/*;q=0.8";

/** 带 UA 与超时的 fetch;失败返回 null 而非抛错。 */
async function get(url, { as = "text" } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: as === "buffer" ? ACCEPT_IMAGE : ACCEPT_HTML,
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return as === "buffer" ? Buffer.from(await res.arrayBuffer()) : await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 下载二进制资源(图片);失败返回 null。 */
export function fetchBinary(url) {
  return get(url, { as: "buffer" });
}

/** HTML 实体反转义(只处理 meta 里常见的那几个)。 */
function decodeEntities(s) {
  return s
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&(?:amp|#38);/g, "&")
    .replace(/&(?:lt|#60);/g, "<")
    .replace(/&(?:gt|#62);/g, ">")
    .replace(/&(?:nbsp|#160);/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();
}

/**
 * 从 HTML 里找 <meta> 的 content。
 * 属性顺序不固定(content 可能在 property 前),故对每个 meta 标签整体匹配。
 * @param {string} html
 * @param {string[]} names 依次尝试的 property/name 值,先命中先返回
 */
function metaContent(html, names) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const name of names) {
    for (const tag of tags) {
      const key = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i);
      if (!key || key[1].toLowerCase() !== name.toLowerCase()) continue;
      const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
      if (content?.[1]?.trim()) return decodeEntities(content[1]);
    }
  }
  return null;
}

/** 从 <link rel="…icon…"> 里挑一个 sharp 能读的(优先 apple-touch-icon,跳过 .ico)。 */
function findFavicon(html, baseUrl) {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const candidates = [];
  for (const tag of links) {
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (!rel || !/icon/.test(rel)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const url = new URL(decodeEntities(href), baseUrl).toString();
    if (/\.ico(\?|$)/i.test(url)) continue; // sharp 读不了 ico
    const size = Number(tag.match(/\bsizes\s*=\s*["'](\d+)/i)?.[1] || 0);
    candidates.push({ url, score: (rel.includes("apple-touch") ? 1000 : 0) + size });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url ?? null;
}

/**
 * 抓一个页面的展示元数据。
 * @param {string} url 已归一化的 URL
 * @returns {Promise<{title:string|null,description:string|null,imageUrl:string|null,faviconUrl:string|null}|null>}
 *          整页抓不到返回 null;抓到但缺字段则对应字段为 null。
 */
export async function fetchOgMeta(url) {
  const html = await get(url);
  if (html == null) return null;

  const title =
    metaContent(html, ["og:title", "twitter:title"]) ??
    decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ??
    null;

  const description = metaContent(html, ["og:description", "twitter:description", "description"]);

  const rawImage = metaContent(html, [
    "og:image:secure_url",
    "og:image:url",
    "og:image",
    "twitter:image",
    "twitter:image:src",
  ]);

  return {
    title: title || null,
    description: description || null,
    imageUrl: rawImage ? new URL(rawImage, url).toString() : null,
    faviconUrl: findFavicon(html, url),
  };
}
