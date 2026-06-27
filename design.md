# jade — 设计系统

> 整体气质:**墨白克制**(ink-on-paper、低饱和、极小圆角、留白多)。令牌定义在
> [src/styles/global.css](src/styles/global.css)(OKLCH);shadcn 用 `base-vega` 风格 + `@base-ui/react`。
> 展示页(`/products`、`/photos`)是**独立设计语言**,令牌在 [src/styles/showcase.css](src/styles/showcase.css),不与本系统共享。

## 设计 Token(站点主体)

- **墨色文字阶**(由深到浅,做层级):`--ink` `oklch(0.26 …)` 正文/标题 → `--ink-2` `oklch(0.5)` 次要 → `--ink-3` `oklch(0.64)` 更弱 → `--ink-4` `oklch(0.76)` 最弱/元信息。Tailwind 经 `text-[var(--ink-2)]` 等使用,或 `text-ink-2`(已映射 `--color-ink-*`)。
- **强调色**:`--accent` `#2a2a2a`、`--accent-ink` `#000`(链接 hover、激活态)。
- **表面**:`--surface` `#ffffff`、`--surface-2` `#f7f7f7`(卡片/次级背景)。
- **字体**:`--font-sans` = Space Grotesk + PingFang SC 等(正文/标题);`--font-mono` = IBM Plex Mono(日期、代码、元信息)。
- **圆角**:`--radius: 2px`(克制,几乎方);阴影极少用。
- **选区**:`::selection` 用 accent 16% 混色。

## 暗色模式

- 由 html 上的 `.dark` class 切换(存 localStorage),令牌在 `.dark` 作用域重定义;自定义变体 `dark:`、`fixed:`(固定布局模式)。

## 布局

- 内容容器最大宽度 `720px`、横向 `px-6`(见首页/文章页)。
- 首页:简介块(`pt-[104px]`)+ 按年份分组的归档列表(`grid-cols-[56px_1fr]`,年份 sticky)。

## 组件规范

- 通用 UI 一律复用 `src/components/ui/`(shadcn 生成),**不要重造**;新组件需要时用 `pnpm dlx shadcn@latest add`。
- 链接:墨色 + hover 到 `--accent-ink`,部分场景配下划线生长动效(见展示页 `LINK` 工具串)。
- 代码块:文件名标题 + 复制按钮 + 超高折叠(见 [docs/modules/components/README.md](docs/modules/components/README.md) blogs 部分)。

## 展示页设计语言(独立)

- **作品集 `/products`**:三套主题(暗房 `dark` / 留白 `light` / 纸感 `paper`)挂在根节点 `data-theme`,色全走 `.works-page` 作用域 CSS 变量;衬线标题 Newsreader、正文 Inter、元信息 IBM Plex Mono。
- **摄影 `/photos`**:单一浅色调(`.photo-page`),横向照片流 + 拨盘时间轴。
- 两者字体/令牌都在 `showcase.css`,与站点主体互不影响。

## 无障碍

- 文字层级用墨色阶而非纯灰,保证对比;交互元素(主题按钮等)带 `aria-label` / `title`。
- 键盘可达、焦点可见沿用 shadcn 默认。
