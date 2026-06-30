/**
 * @purpose 把任意本地图片处理成 WebP 并上传 R2 的通用 CLI(非 MDX 用,如作品集/展示页图片):复用 process-image 压缩 + r2 上传,打印 url/宽高/thumbhash 供手动填进数据文件。
 * @role    与 img.mjs(MDX 专用)并列;img.mjs 改写文章,本脚本只产出托管后的元信息,数据表(如 works-data)手动维护。
 * @deps    本目录 lib/process-image(processImage)、lib/r2(loadEnv/r2Config/uploadToR2);node:fs
 * @gotcha  默认 prefix=works、maxWidth=2400、quality=88(比博客 1600/80 更清晰);--dry-run 不上传只打印;内容寻址命名,同图重传同 key(幂等)。
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { processImage } from "./lib/process-image.mjs";
import { loadEnv, r2Config, uploadToR2, publicUrl } from "./lib/r2.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const getOpt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const prefix = getOpt("--prefix", "works").replace(/^\/+|\/+$/g, "");
const maxWidth = Number(getOpt("--width", "2400"));
const quality = Number(getOpt("--quality", "88"));
const VALUE_OPTS = new Set(["--prefix", "--width", "--quality"]);
const files = args.filter((a, i) => !a.startsWith("--") && !VALUE_OPTS.has(args[i - 1]));

if (!files.length) {
  console.error(
    "用法: node scripts/upload-asset.mjs <图片...> [--prefix works] [--width 2400] [--quality 88] [--dry-run]",
  );
  process.exit(1);
}

const cfg = dryRun ? null : r2Config(loadEnv());
const out = [];

for (const file of files) {
  const bytes = readFileSync(file);
  const { webpBuffer, width, height, hash, thumbhash } = await processImage(bytes, {
    maxWidth,
    quality,
  });
  const key = `${prefix}/${hash}.webp`;
  const kb = (webpBuffer.length / 1024).toFixed(0);
  let url;
  if (dryRun) {
    url = `<R2>/${key}`;
    console.log(`· ${basename(file)} → ${hash}.webp  ${width}x${height}  ${kb}KB  [未上传]`);
  } else {
    url = await uploadToR2(cfg, key, webpBuffer, "image/webp");
    console.log(`· ${basename(file)} → ${url}  ${width}x${height}  ${kb}KB`);
  }
  out.push({ file: basename(file), url, width, height, thumbhash });
}

console.log("\n--- JSON ---");
console.log(JSON.stringify(out, null, 2));
