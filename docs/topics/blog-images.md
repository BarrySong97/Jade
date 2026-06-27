# 博客图片管线(blog-images)

## 这是什么 / 为什么单独成篇
一套**本地工具 + 运行时组件**:把文章里的本地图片压缩、传到 Cloudflare R2、生成模糊占位,并把 Markdown 图片就地换成自包含的 `<BlogImage/>`。跨 `scripts/` 与 `src/components/`,故单列专题。设计取舍见 [ADR-0001](../decisions/0001-blog-image-pipeline.md)。

## 涉及的模块 / 文件
- 工具(CLI):[scripts/img.mjs](../../scripts/img.mjs) — 入口;[scripts/lib/process-image.mjs](../../scripts/lib/process-image.mjs) — sharp 压缩 + blake2b 命名 + thumbhash;[scripts/lib/r2.mjs](../../scripts/lib/r2.mjs) — 读 .env + aws4fetch 上传。
- 组件:[src/components/blogs/blog-image.tsx](../../src/components/blogs/blog-image.tsx) — `<BlogImage/>`。
- 凭据:`.env`(由 [.env.example](../../.env.example) 复制填写,已 gitignore)。

## 用法
1. 一次性配置:`cp .env.example .env`,填 R2 账户/Key/桶/公开域名。
2. 在文章里正常写本地图(标准 Markdown 图片语法,圆括号里填本地相对路径;图片放在 mdx 同目录、`public/` 或仓库相对路径)。
3. 跑:`pnpm img <slug 或 mdx 路径>`(先 `--dry-run` 演练不上传)。
   - 例:`pnpm img 2025-overview` 或 `pnpm img src/content/blog/foo.mdx --dry-run`
4. 工具会:压成限宽 WebP(默认 1600/q80)→ blake2b 命名 `<prefix>/<hash>.webp` → 传 R2 → 生成 thumbhash → 把 `![]()` 改写成
   `<BlogImage client:visible src=… alt=… width={…} height={…} thumbhash=… />` 并在 frontmatter 后补 import。

## 运行时表现
- `<BlogImage>` 在 **SSR 时**就把 thumbhash 解码成模糊 PNG dataURL 作背景(零额外请求、无布局跳动,靠 `width/height` 撑 aspect-ratio)。
- 真图 `loading="lazy"` 加载完淡入;点击经现有 [webgl-viewer](../modules/components/webgl-viewer.md) 放大看原图。

## 注意事项
- **幂等**:已改写成 `<BlogImage>` 的不会被再次处理;只认本地路径,远程 `http(s)://` 图片跳过。
- **内容寻址**:同图内容→同 hash→同 key,自动去重;改图自动换名,可对 R2 配 `immutable` 强缓存(上传已带该头)。
- blake2b 只用于**文件名**,thumbhash 只用于**占位**——别把两者混为一谈。
- 老 `cloud-image-*`(hero 封面用)暂留,新图一律走本管线;迁移完再删。
- 摄影页(`/photos`)图片是另一套,后续单独重做,不走本管线。
