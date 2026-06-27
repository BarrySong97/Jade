# 0001. 博客图片管线:ThumbHash 占位 + blake2b 内容寻址 + R2 上传

- 状态:已采纳
- 日期:2026-06-27

## 背景

老的云图片方案(`cloud-image-*` + `{basename}_{type}_{width}x{height}.{ext}` 命名约定 + 单独 `_blurhash.webp` 占位文件)又重又易漂:6 种尺寸变体、占位要额外一次网络请求、组件靠解析文件名拿尺寸。正文图片实际多是裸 R2 链接、无占位。需要一套更干净、可本地化、面向 blog 的图片管线。

## 决策

1. **占位用 ThumbHash 字符串内联**:每张图算出 ~25 字节的 thumbhash,作为组件 prop 写进 MDX。组件在 SSR 时即把它解码成模糊 dataURL 占位(零额外请求),真图 `loading="lazy"` 加载完淡入。
2. **文件名用 blake2b 内容哈希**:压缩后的 WebP 以 `blake2b(内容)` 命名(`blog/<hash>.webp`),内容寻址、可永久强缓存、自动去重。
3. **只出一张限宽 WebP**(默认 1600px / q80),砍掉老的 6 变体方案。
4. **存储 Cloudflare R2**,经 S3 兼容 API 用轻量 `aws4fetch` 上传(不引整个 aws-sdk)。凭据放 `.env`(`.env.example` 为模板)。
5. **本地 CLI `pnpm img <slug>`**:扫文章里的本地图片 → sharp 压缩 → 命名 → 上传 → 生成 thumbhash → **就地把 `![]()` 改写成 `<BlogImage/>`**(自包含,不依赖中心清单)。
6. **新组件 `<BlogImage>`** 专为 blog;点击放大复用现有 WebGL viewer。

> 澄清:用户口中的 "blake2b hash 占位" 是概念混淆——blake2b 是内容哈希(用于①文件名),无法当模糊图显示;真正的模糊占位是 ThumbHash(用于②占位)。二者各司其职。

## 理由

- ThumbHash 优于 BlurHash(更小、含透明度、颜色更准),内联比单独占位文件少一次请求、少一处漂移。
- 内容寻址命名让缓存可 `immutable`,改图自动换名、无需手动 bust。
- aws4fetch 比 `@aws-sdk/client-s3` 轻几个数量级,够用。
- 单变体 + 就地改写 MDX,降低心智负担,符合"在本地写一套工具按需处理"的诉求。

## 后果

- 老 `cloud-image-*` 暂时保留(现有文章仍依赖),新图一律走 `<BlogImage>`;迁移完再删。
- 真 `.env` 由用户填(含 R2 密钥);为放行无密钥模板,放宽了 [guard.mjs](../../scripts/hooks/guard.mjs) / [guard-files.mjs](../../scripts/hooks/guard-files.mjs):`*.example/*.sample/*.template` 不再被拦,真 `.env*` 仍拦。
- `thumbhash` 进 runtime 依赖(组件用),`aws4fetch` 进 devDependencies(仅脚本用)。
- 管线全貌见专题 [docs/topics/blog-images.md](../topics/blog-images.md)。
