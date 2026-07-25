# 引用卡片(PostCard / LinkCard)— 实现计划

> 状态:已实现。用法见 [topics/link-cards.md](../topics/link-cards.md),取舍见 [ADR-0002](../decisions/0002-link-card-cache.md)。

- 日期:2026-07-25
- 关联设计稿:https://claude.ai/code/artifact/db2493f6-a1d5-4162-b029-8b62a19d8bb9

## 方案概述

正文里引用一条链接时展开成一张卡(Twitter big image card 的形态,但落到本站「墨白克制」令牌上)。两个组件:

- `PostCard` — 引用**站内文章**,数据来自 content collection(`getEntry("blog", slug)`),构建期天然全有,不需要任何缓存。
- `LinkCard` — 引用**外部网站**,数据来自**提交进仓库的 JSON 缓存** `src/data/link-cards.json`;og:image 下载后过一遍现有图片管线传自己的 R2。构建期只读文件、零联网。

三档形态(有图 → 无图 → 无描述)共用一套骨架,由 `reference-card.astro` 统一渲染,两个公开组件只负责取数与决定形态。

**为什么是 .astro 而不是 React 岛**:卡片纯静态、无交互(hover 全靠 CSS),按 [conventions](../conventions.md#react-in-astro)「静态内容保持纯 Astro/HTML」。thumbhash 在构建期解码成 dataURL 内联,首帧即有占位、零 JS。

**为什么 og:image 要转存自己的 R2 而不是直接外链**:对方防盗链 403、改图删图会破图、无 CORS、体积不可控、读者 IP 暴露给对方服务器。转存后还能复用 `processImage` 拿到 thumbhash,加载态与 `<BlogImage>` 完全一致。

**为什么缓存 key 不需要运行时归一化**:CLI 会把 MDX 里的 `url=` **就地改写成归一化后的形式**(同 `img.mjs` 改写 `![]()` 的思路),所以运行时是精确字符串匹配,不存在两处归一化逻辑漂移。

## 涉及文件 / 模块

新增:

- `src/components/blogs/reference-card.astro` — 共用骨架(三种 variant 的纯展示层)
- `src/components/blogs/post-card.astro` — 站内,按 slug 取 collection
- `src/components/blogs/link-card.astro` — 站外,查 JSON 缓存
- `src/lib/thumbhash-placeholder.ts` — 构建期把 thumbhash 解码成 `{ avg, url }`(供 .astro 用,逻辑与 `blog-image.tsx` 里那段一致)
- `src/data/link-cards.json` — 外链元数据缓存(**提交进仓库**)
- `scripts/link-card.mjs` — 抓取 CLI,入口 `pnpm linkcard`(**不能叫 `pnpm link`,与 pnpm 内置命令冲突**)

改动:

- `package.json` — 加 `"linkcard": "node scripts/link-card.mjs"`
- `docs/conventions.md` — 目录约定补一行 `src/data/`
- `docs/modules/components/README.md` + `docs/modules/lib/README.md` — 同步新组件/工具
- `docs/topics/link-cards.md` — 新专题(跨 scripts/components,与 blog-images 并列)
- `docs/decisions/0002-link-card-cache.md` — ADR:为什么用提交式 JSON 缓存 + 转存 R2

## 缓存格式

key = 归一化 URL(小写 host、去 `www.`、去 `utm_*`/`fbclid` 等追踪参数、去 `#fragment`、去尾斜杠)。

```json
{
  "https://anthropic.com/engineering/building-effective-agents": {
    "domain": "anthropic.com",
    "title": "Building effective agents",
    "description": "…",
    "image": "https://blogassets.4real.ink/link/9f3a….webp",
    "imageWidth": 1600,
    "imageHeight": 838,
    "thumbhash": "uggCBIDIhamKh3d/pHK+ar+b9w==",
    "favicon": "https://blogassets.4real.ink/link/fav-2c7b….webp",
    "fetchedAt": "2026-07-25"
  }
}
```

抓不到的字段写 `null` **并落盘**——「这个站没有 og:image」是确定结论,不该每次构建重试。

## 任务拆解(均已完成)

1. [x] `scripts/lib/og.mjs`:取 HTML → 解析 og/twitter/`<title>`/`<meta name=description>`/favicon(纯正则,不引 DOM 解析依赖)
2. [x] `scripts/link-card.mjs`:归一化 URL → 查缓存(幂等)→ 抓元数据 → 图片走 `processImage` + `uploadToR2`(key 前缀 `link/`)→ 写 JSON → 就地改写 MDX 的 `url=`
   - 参数:`<url>` / `--scan`(扫全部 MDX 补齐)/ `--refresh` / `--dry-run`
3. [x] `src/lib/thumbhash-placeholder.ts` + `reference-card.astro`(三档形态 + hover 态,严格用 `--ink*/--line*` 令牌,Tailwind 优先)
4. [x] `post-card.astro` / `link-card.astro`
5. [x] 缺条目行为:`import.meta.env.DEV` 下 `console.warn` + 渲染兜底档;构建时 `throw`(静态站悄悄降级不会被发现)
6. [x] 在一篇真实 MDX 里插两张卡验证
7. [x] 文档同步(文件头 / modules / 新专题 / ADR / conventions)+ `check-docs` + `pnpm check`

## 风险 / 注意

- **`pnpm link` 是 pnpm 内置命令**,脚本名必须避开。
- MDX 改写要**幂等**:已是归一化 URL 就不写文件(同 `img.mjs` 的「无转换则不写」)。
- favicon 常见是 `.ico`,sharp 读不了 → 优先 `apple-touch-icon`/png/svg,拿不到就 `null`,组件退回首字母墨块。
- 抓取要设 UA + 超时(10s),避免 CI 里挂死;但正常构建根本不联网,只有跑 CLI 时才会。
- `src/data/` 是新目录,记得写进 conventions,否则下个 agent 不知道它存在。

## 验证方式

- `pnpm linkcard --dry-run <url>` 打印解析结果,不落盘不上传。
- 真跑一条外链 + 一条无 og:image 的站,确认 JSON 落盘、图片进 R2、MDX 被改写。
- `pnpm build` 通过;`pnpm dev` 打开该文章页,肉眼核对三档形态与设计稿一致,DevTools 确认无水合 JS。
- 故意删掉 JSON 里一条 → `pnpm build` 应当**报错退出**。
- 收尾 `node scripts/check-docs.mjs` 0 ❌ + `pnpm check` 干净。
