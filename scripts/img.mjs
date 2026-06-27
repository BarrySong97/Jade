/**
 * @purpose 博客图片本地管线 CLI:扫某篇 MDX 引用的本地图片,压缩+上传 R2,并就地把 ![]() 改写成 <BlogImage/>。
 * @role    `pnpm img <slug|mdx路径>` 的入口;编排 process-image 与 r2 上传,改写 MDX 并补 import。
 * @deps    本目录 lib/process-image、lib/r2;node:fs/path
 * @gotcha  只处理本地路径图片(跳过 http/data);--dry-run 不上传只演练;幂等(已是 <BlogImage> 的不再处理)。详见 docs/topics/blog-images.md
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join, isAbsolute } from "node:path";
import { processImage } from "./lib/process-image.mjs";
import { loadEnv, r2Config, uploadToR2 } from "./lib/r2.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((a) => !a.startsWith("--"));
const target = positional[0];

if (!target) {
  console.error("用法: pnpm img <slug 或 mdx 路径> [--dry-run]");
  process.exit(1);
}

const BLOG_DIR = resolve("src/content/blog");
const IMPORT_LINE = 'import BlogImage from "@/components/blogs/blog-image";';

function resolveMdx(t) {
  if (existsSync(t) && /\.mdx?$/.test(t)) return resolve(t);
  for (const ext of [".mdx", ".md"]) {
    const p = join(BLOG_DIR, t + ext);
    if (existsSync(p)) return p;
  }
  return null;
}

const mdxPath = resolveMdx(target);
if (!mdxPath) {
  console.error(`找不到文章: ${target}(既不是 mdx 文件,也不是 ${BLOG_DIR} 下的 slug)`);
  process.exit(1);
}

let content = readFileSync(mdxPath, "utf8");
const mdxDir = dirname(mdxPath);

// 找 markdown 图片 ![alt](path),只保留本地路径(非 http/https/data/协议相对)
const IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const matches = [...content.matchAll(IMG_RE)].filter(
  ([, , src]) => !/^(https?:|data:|\/\/)/i.test(src),
);

if (!matches.length) {
  console.log("没找到需要处理的本地图片(可能已改写过,或都是远程链接)。");
  process.exit(0);
}

const cfg = dryRun ? null : r2Config(loadEnv());
console.log(`处理 ${mdxPath} — ${matches.length} 张本地图片${dryRun ? "(dry-run,不上传)" : ""}`);

for (const m of matches) {
  const [full, altRaw, srcRaw] = m;
  const src = srcRaw.replace(/^\.\//, "");
  const candidates = [
    isAbsolute(src) ? src : resolve(mdxDir, src),
    resolve("public", src.replace(/^\//, "")),
    resolve(src),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.warn(`  ⚠️ 找不到本地文件,跳过: ${srcRaw}`);
    continue;
  }

  const { webpBuffer, width, height, hash, thumbhash } = await processImage(readFileSync(found));
  const kb = (webpBuffer.length / 1024).toFixed(0);
  const prefix = dryRun ? "<prefix>" : cfg.keyPrefix;
  const key = `${prefix}/${hash}.webp`;

  let url;
  if (dryRun) {
    url = `<R2_PUBLIC_BASE>/${key}`;
    console.log(
      `  · ${srcRaw} → ${hash}.webp  ${width}x${height} ${kb}KB  th=${thumbhash.length}b  [未上传]`,
    );
  } else {
    url = await uploadToR2(cfg, key, webpBuffer, "image/webp");
    console.log(`  · ${srcRaw} → ${url}  ${width}x${height} ${kb}KB`);
  }

  const alt = altRaw.replace(/"/g, "&quot;");
  const tag = `<BlogImage client:visible src="${url}" alt="${alt}" width={${width}} height={${height}} thumbhash="${thumbhash}" />`;
  content = content.replace(full, () => tag); // 函数式替换,避免 $ 特殊串
}

// 补 import(放在 frontmatter 之后)
if (!content.includes(IMPORT_LINE)) {
  if (content.startsWith("---")) {
    const fmEnd = content.indexOf("\n---", 3);
    const lineEnd = content.indexOf("\n", fmEnd + 1);
    content = `${content.slice(0, lineEnd + 1)}\n${IMPORT_LINE}\n${content.slice(lineEnd + 1)}`;
  } else {
    content = `${IMPORT_LINE}\n\n${content}`;
  }
}

if (dryRun) {
  console.log("dry-run:未写回 MDX。");
} else {
  writeFileSync(mdxPath, content, "utf8");
  console.log(`✅ 已改写 ${mdxPath}`);
}
