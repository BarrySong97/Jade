/**
 * @purpose 外链卡片元数据管线 CLI:抓一条(或扫全站 MDX 补齐)外链的标题/描述/og:image,图片转存 R2,结果写进 src/data/link-cards.json,并把 MDX 里的 url 就地改写成归一化形式。
 * @role    `pnpm linkcard <url|--scan>` 的入口;编排 lib/og(抓取解析)、lib/process-image(压缩+thumbhash)、lib/r2(上传)。
 * @deps    本目录 lib/og、lib/process-image、lib/r2;node:fs/path
 * @gotcha  命令名不能叫 `link`(与 pnpm 内置命令冲突)。幂等:缓存已有的跳过,除非 --refresh;MDX 无需改写则不写文件。抓不到的字段写 null 也要落盘——「该站没有 og:image」是确定结论,不该每次构建重试。详见 docs/topics/link-cards.md
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fetchOgMeta, fetchBinary, normalizeUrl, displayDomain } from "./lib/og.mjs";
import { processImage } from "./lib/process-image.mjs";
import { loadEnv, r2Config, uploadToR2 } from "./lib/r2.mjs";

const BLOG_DIR = resolve("src/content/blog");
const CACHE_PATH = resolve("src/data/link-cards.json");
// 外链素材单独的 key 前缀,与文章图片(R2_KEY_PREFIX,默认 blog)分开
const LINK_PREFIX = "link";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const refresh = args.includes("--refresh");
const scan = args.includes("--scan");
const positional = args.filter((a) => !a.startsWith("--"));

if (!scan && positional.length === 0) {
  console.error("用法: pnpm linkcard <url> [--refresh] [--dry-run]");
  console.error("      pnpm linkcard --scan [--refresh] [--dry-run]   # 扫全部 MDX,补齐缺的外链");
  process.exit(1);
}

/* ---------------- 缓存读写 ---------------- */

function readCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch (e) {
    console.error(`❌ 缓存文件损坏,无法解析: ${CACHE_PATH}\n   ${e.message}`);
    process.exit(1);
  }
}

function writeCache(cache) {
  // key 排序,保证 diff 稳定、不会因为抓取顺序抖动
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(CACHE_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

/* ---------------- MDX 扫描 / 改写 ---------------- */

function listMdx() {
  return readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => join(BLOG_DIR, f));
}

/** 抓出 MDX 里所有 <LinkCard ... url="…" …/> 的 url。 */
function extractUrls(source) {
  const urls = [];
  for (const tag of source.match(/<LinkCard\b[^>]*\/?>/g) || []) {
    const url = tag.match(/\burl\s*=\s*["']([^"']+)["']/)?.[1];
    if (url) urls.push(url);
  }
  return urls;
}

/**
 * 把 MDX 里写的 url 换成归一化形式,让运行时可以精确命中缓存 key。
 * 幂等:没有任何一条需要改写就不写文件。
 */
function rewriteMdxUrls() {
  let changed = 0;
  for (const file of listMdx()) {
    const src = readFileSync(file, "utf8");
    const next = src.replace(/(<LinkCard\b[^>]*?\burl\s*=\s*")([^"]+)(")/g, (m, pre, url, post) => {
      try {
        const norm = normalizeUrl(url);
        return norm === url ? m : `${pre}${norm}${post}`;
      } catch {
        return m;
      }
    });
    if (next !== src) {
      changed++;
      if (!dryRun) writeFileSync(file, next);
      console.log(`  ↻ 归一化 MDX 中的 url: ${file.replace(`${process.cwd()}/`, "")}`);
    }
  }
  return changed;
}

/* ---------------- 图片转存 ---------------- */

/**
 * 下载一张外部图片,压缩后传到 R2。
 * @returns {Promise<{url:string,width:number,height:number,thumbhash:string}|null>} 任一环节失败返回 null(卡片自动降级)
 */
async function mirrorImage(cfg, srcUrl, { maxWidth, quality, keyTag }) {
  const buf = await fetchBinary(srcUrl);
  if (!buf?.length) {
    console.log(`  ⚠️  图片下载失败,跳过: ${srcUrl}`);
    return null;
  }
  let processed;
  try {
    processed = await processImage(buf, { maxWidth, quality });
  } catch (e) {
    console.log(`  ⚠️  图片处理失败(格式不支持?),跳过: ${srcUrl}\n     ${e.message}`);
    return null;
  }
  const { webpBuffer, width, height, hash, thumbhash } = processed;
  const key = `${LINK_PREFIX}/${keyTag}${hash}.webp`;
  if (dryRun) {
    console.log(`  [dry-run] 将上传 ${key}(${width}×${height}, ${webpBuffer.length} B)`);
    return { url: `<R2>/${key}`, width, height, thumbhash };
  }
  const url = await uploadToR2(cfg, key, webpBuffer, "image/webp");
  console.log(`  ↑ ${key}(${width}×${height})`);
  return { url, width, height, thumbhash };
}

/* ---------------- 单条处理 ---------------- */

async function resolveOne(cfg, rawUrl, cache) {
  let url;
  try {
    url = normalizeUrl(rawUrl);
  } catch {
    console.log(`❌ 不是合法 URL,跳过: ${rawUrl}`);
    return false;
  }

  if (cache[url] && !refresh) {
    console.log(`· 已缓存,跳过: ${url}(要重抓加 --refresh)`);
    return false;
  }

  console.log(`\n▸ ${url}`);
  const meta = await fetchOgMeta(url);
  if (!meta) {
    console.log("  ⚠️  页面抓取失败(超时/403/404)——写入兜底条目,卡片会退到纯文本档");
  }

  const entry = {
    domain: displayDomain(url),
    title: meta?.title ?? null,
    description: meta?.description ?? null,
    image: null,
    imageWidth: null,
    imageHeight: null,
    thumbhash: null,
    favicon: null,
    fetchedAt: new Date().toISOString().slice(0, 10),
  };

  if (meta?.imageUrl) {
    const img = await mirrorImage(cfg, meta.imageUrl, { maxWidth: 1600, quality: 80, keyTag: "" });
    if (img) {
      entry.image = img.url;
      entry.imageWidth = img.width;
      entry.imageHeight = img.height;
      entry.thumbhash = img.thumbhash;
    }
  } else {
    console.log("  · 无 og:image → 卡片走紧凑档");
  }

  if (meta?.faviconUrl) {
    const fav = await mirrorImage(cfg, meta.faviconUrl, {
      maxWidth: 64,
      quality: 90,
      keyTag: "fav-",
    });
    if (fav) entry.favicon = fav.url;
  }
  if (!entry.favicon) console.log("  · 无可用 favicon → 用域名首字母墨块");

  console.log(`  标题: ${entry.title ?? "(无)"}`);
  console.log(`  描述: ${entry.description ? `${entry.description.slice(0, 60)}…` : "(无)"}`);

  cache[url] = entry;
  return true;
}

/* ---------------- 主流程 ---------------- */

const env = loadEnv();
let cfg = null;
try {
  cfg = r2Config(env);
} catch (e) {
  if (!dryRun) throw e;
  console.log(`[dry-run] 未配置 R2(${e.message}),仅演练不上传\n`);
}

const cache = readCache();

// 先归一化 MDX 里的 url,再据此收集待抓列表,顺序不能反
const rewritten = rewriteMdxUrls();
if (rewritten === 0) console.log("· MDX 中的 url 均已是归一化形式");

const targets = scan
  ? [...new Set(listMdx().flatMap((f) => extractUrls(readFileSync(f, "utf8"))))]
  : positional;

if (targets.length === 0) {
  console.log("\n没有找到任何 <LinkCard url=…>,无事可做。");
  process.exit(0);
}

let written = 0;
for (const t of targets) {
  if (await resolveOne(cfg, t, cache)) written++;
}

if (written > 0 && !dryRun) {
  writeCache(cache);
  console.log(`\n✅ 写入 ${written} 条 → ${CACHE_PATH.replace(`${process.cwd()}/`, "")}`);
  console.log("   记得把 src/data/link-cards.json 一起提交。");
} else if (written > 0) {
  console.log(`\n[dry-run] 将写入 ${written} 条,未落盘。`);
} else {
  console.log("\n无新增条目。");
}
