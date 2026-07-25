# 0002. 外链卡片元数据:提交进仓库的 JSON 缓存 + og:image 转存 R2

- 状态:已采纳
- 日期:2026-07-25

## 背景

正文要能引用一条链接并展开成卡片(站内文章 + 外部网站两种)。站内数据来自 content collection,构建期天然全有;**外部链接的 title / description / og:image 得从对方站点拿**,而本站是静态站(SSG),必须在构建期就确定这些值。

## 决策

1. **元数据存一份提交进仓库的 JSON**:`src/data/link-cards.json`,组件 `import` 后查表,**构建期零联网**。
2. **key 是归一化 URL**(小写 host、去 `www.`、去 `utm_*` 等追踪参数、去 fragment、去尾斜杠),定义唯一地写在 `scripts/lib/og.mjs` 的 `normalizeUrl`。
3. **抓取是一次性动作**,由 CLI `pnpm linkcard` 完成,并**就地把 MDX 里的 `url=` 改写成归一化形式**——于是运行时只需精确字符串匹配,不存在「两处归一化逻辑漂移」。
4. **og:image / favicon 下载后转存自己的 R2**,复用现有 `processImage`(WebP + blake2b 命名 + thumbhash)与 `uploadToR2`,key 前缀 `link/`。
5. **抓不到的字段写 `null` 也要落盘**:「该站没有 og:image」是确定结论,不该每次构建重试。组件据此三档降级(wide → compact → text)。
6. **缺条目时构建直接失败**(dev 下只告警):静态站悄悄降级不会被发现。

## 理由

- 对比「构建期实时抓」:构建不再依赖外网,CI 稳定可复现,对方改标题不会让历史文章悄悄变样;代价是新链接要多跑一条命令。
- 对比「MDX 里手填」:省掉每条链接手敲标题描述、手传图,同时保留 props 覆盖(对方标题起得烂时可以改)。
- **不外链对方图片**的理由:防盗链 403、对方改图删图会破图、无 CORS、体积不可控、读者 IP 暴露给对方服务器;转存后还能拿到 thumbhash,加载态与 `<BlogImage>` 一致。
- 与 [ADR-0001](./0001-blog-image-pipeline.md) 同一套哲学:本地 CLI 处理 + 结果自包含,不在运行时做不确定的事。

## 后果

- `src/data/` 是新增目录(已写进 [conventions](../conventions.md));`link-cards.json` 必须和文章一起提交,否则别人 clone 下来构建失败。
- 命令名是 `pnpm linkcard`——`pnpm link` 是 pnpm 内置命令,占用了。
- 改 `normalizeUrl` 等于改缓存格式,旧 key 会失配,需 `--refresh` 重抓。
- 文章删了但缓存条目还在只是冗余,目前没有 prune 命令。
- 卡片嵌在 `.prose` 里需要 `not-prose` + `ref-card` 双重隔离(手写的 `.prose` 规则无层级,会盖过 Tailwind utilities),细节见专题 [docs/topics/link-cards.md](../topics/link-cards.md)。
