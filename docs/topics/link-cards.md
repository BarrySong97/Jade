# 引用卡片(link-cards)

## 这是什么 / 为什么单独成篇

正文里引用一条链接时展开成一张卡(Twitter big image card 的形态,落到本站墨白克制令牌上)。两个组件 + 一条抓取管线 + 一份提交进仓库的缓存,跨 `scripts/` 与 `src/components/`,故单列专题。缓存方案的取舍见 [ADR-0002](../decisions/0002-link-card-cache.md)。

## 涉及的模块 / 文件

- 组件:[reference-card.astro](../../src/components/blogs/reference-card.astro) — 共用骨架(三档形态);[post-card.astro](../../src/components/blogs/post-card.astro) — 站内;[link-card.astro](../../src/components/blogs/link-card.astro) — 站外。
- 工具:[src/lib/thumbhash-placeholder.ts](../../src/lib/thumbhash-placeholder.ts) — 构建期把 thumbhash 解码成占位样式。
- 抓取(CLI):[scripts/link-card.mjs](../../scripts/link-card.mjs) — 入口;[scripts/lib/og.mjs](../../scripts/lib/og.mjs) — URL 归一化 + OG 解析;图片复用 [lib/process-image.mjs](../../scripts/lib/process-image.mjs) 与 [lib/r2.mjs](../../scripts/lib/r2.mjs)。
- 缓存:[src/data/link-cards.json](../../src/data/link-cards.json)(**提交进仓库**)。
- 凭据:与图片管线共用 `.env`(R2)。

## 用法

站内文章 —— 不需要任何准备,数据从 content collection 直接读:

```mdx
import PostCard from "@/components/blogs/post-card.astro";

<PostCard slug="ai-era-accounting-design" />
<PostCard slug="ai-era-accounting-design" variant="compact" />
```

外部链接 —— 先抓一次,把 JSON 一起提交:

```mdx
import LinkCard from "@/components/blogs/link-card.astro";

<LinkCard url="https://anthropic.com/engineering/building-effective-agents" />
```

```
pnpm linkcard <url>          # 抓一条
pnpm linkcard --scan         # 扫全部 MDX,补齐缺的
pnpm linkcard --refresh <url># 强制重抓(对方改了标题/换了图)
pnpm linkcard --dry-run …    # 演练,不落盘不上传
```

`--scan` 会顺手把 MDX 里的 `url=` 就地改写成归一化形式,这样运行时是精确匹配。

## 默认规则:站外用大图,站内用紧凑

用户定的规则,**别再一篇一个样**:

- `<LinkCard>`(站外)默认 `auto` → 有 og:image 就是大图档
- `<PostCard>`(站内)默认 **`compact`** → 统一是左缩略图 + 右文字

需要时都能用 `variant` 显式覆盖。

## 三档形态(降级顺序)

`variant="auto"` 按素材决定,也可以显式传 `wide` / `compact` / `text`:

| 素材              | 形态      | 长相                                                       |
| ----------------- | --------- | ---------------------------------------------------------- |
| 有封面 / og:image | `wide`    | **整张就是图**(10px 圆角、不描边),标题压在左下角深色浮层里 |
| 无图但有描述      | `compact` | 左 1:1 格子(favicon 放大 / 域名首字母)+ 右文字             |
| 都没有            | `text`    | 去掉图区,左缘 3px 墨条                                     |

- **大图档只有图和标题浮层**,没有图下方的标题/描述块,也没有元信息行(用户明确要求,参照 Twitter big image card)。图用**自身比例**渲染(og:image 常见 1.91:1、文章封面 16:9),不裁切。
- 紧凑 / 纯文本两档才有元信息行:站内是日期、无角标;站外是 favicon + 域名、右上角 `↗`。
- 站外卡一律 `target="_blank"`。抓取失败最终落到 `text` 档,**任何情况都不出现破图**。

## 运行时表现

- **零 JS**:纯 `.astro`,不是岛。hover 全走 CSS,且**图片不做任何缩放**(用户明确要求):大图档只是标题浮层底色加深,紧凑/纯文本档是边框 `--line`→`--line-2`、标题→`--accent-ink`。
- 占位:有 thumbhash 时在构建期解码成平均色 + 模糊图内联到 `style`,首帧即有底、无布局跳动;真图 `loading="lazy"`。
- 缺缓存条目:`dev` 下 `console.warn` 并渲染兜底档,**构建时直接抛错**——静态站悄悄降级不会被发现。

## 注意事项

- **命令叫 `pnpm linkcard`,不能叫 `pnpm link`**(与 pnpm 内置命令冲突)。
- **`<PostCard slug>` 传的是 collection 的 id,不是文件名原样**:Astro 的 glob loader 会把 id 小写化(`how-I-find-*.mdx` → `how-i-find-*`)。组件已做「原样查不到就退回小写」的容错,但写的时候直接用小写最省事。
- **归一化 URL 是缓存 key 的唯一定义**,写在 `scripts/lib/og.mjs` 的 `normalizeUrl`。改它等于改缓存格式,旧 key 会失配,需要 `--refresh` 重抓。
- **og:image 转存自己的 R2,不外链**:对方防盗链 403 / 改图删图 / 无 CORS / 读者 IP 暴露,转存后还能复用 `processImage` 拿 thumbhash。
- 卡片嵌在 `.prose` 里要挡两拨样式,**两个都不能少**:`not-prose` 挡 `@tailwindcss/typography` 插件(其选择器自带该逃生舱),`ref-card` 挡 `global.css` 里手写的 `.prose` 规则(无逃生舱,靠 `.prose .ref-card` 的 `revert-layer` 退回 utilities 层)。手写的 `.prose` 规则是**无层级**的,会盖过 Tailwind utilities——这是踩过的坑。
- favicon 常见是 `.ico`,sharp 读不了 → 优先 `apple-touch-icon`/png/svg,拿不到就 `null`,组件退回首字母墨块。
- 文章删了但缓存条目还在时不会报错(只是冗余),目前没有 prune 命令。

## 设计稿

三档形态与数值规格:https://claude.ai/code/artifact/db2493f6-a1d5-4162-b029-8b62a19d8bb9
