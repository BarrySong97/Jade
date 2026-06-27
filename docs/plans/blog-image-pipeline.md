# 计划:博客图片管线

> 状态:已实现。设计与取舍见 [ADR-0001](../decisions/0001-blog-image-pipeline.md),用法见 [topics/blog-images.md](../topics/blog-images.md)。

## 目标
本地一套工具:压缩文章图片 + 传 Cloudflare R2 + 生成 thumbhash 占位,并就地改写成自包含的 `<BlogImage/>`;配套一个 blog 专用图片组件。

## 涉及文件
- 新增:`scripts/img.mjs`、`scripts/lib/process-image.mjs`、`scripts/lib/r2.mjs`、`src/components/blogs/blog-image.tsx`、`.env.example`、`docs/topics/blog-images.md`、`docs/decisions/0001-*.md`。
- 改动:`package.json`(`img` 脚本、`thumbhash`/`aws4fetch` 依赖)、`scripts/hooks/guard*.mjs`(放行 `*.example` 模板、format-lint 跳过非代码)、`docs/run.md` / `AGENTS.md` / `docs/modules/components/README.md`(导航与说明)。

## 任务拆解(均已完成)
1. 放宽 guard 允许 `.env.example`;写 ADR。
2. 加 `thumbhash`(runtime)/`aws4fetch`(dev);建 `.env.example`。
3. 写 CLI:sharp 压缩 → blake2b 命名 → thumbhash → R2 上传 → 改写 MDX(`--dry-run` 支持)。
4. 写 `<BlogImage>`:SSR thumbhash 占位 + 懒加载淡入 + WebGL lightbox。
5. 文档 + `check-docs` 清零 + dry-run/真渲染验证。

## 待办(后续)
- 真 `.env` 由用户填好后,挑一篇文章 `pnpm img <slug>` 实跑验证上传。
- 摄影页(`/photos`)图片组件重做(单独排期)。
- 全部正文图迁移到 `<BlogImage>` 后,移除老 `cloud-image-*`。
