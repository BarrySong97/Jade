# 0013. 字体自托管并按用量拆成 core / extended 子集

- 状态:已采纳
- 日期:2026-10-30

## 背景

字体原从 Google Fonts 加载:`global.css` 里 `@import` 第三方 CSS,再由它引用 gstatic 的 woff2。每页实际下载 Space Grotesk latin 22,320 B + IBM Plex Mono 400 latin 10,052 B = 32,372 B,另有约 1.3 KB(gzip)的第三方 CSS;请求链为 HTML → 站点 CSS → Google CSS → 字体,无预加载,还要连两个第三方源。Google 下发的子集与站点实际用到的字符、特性无关,且偶尔会改发动态生成的静态实例(`/l/font?kit=…`,42,859 B),同一页面两次加载像素都不一致。

要求:字节尽量少、渲染逐像素不变、不改 `font-display` 与回退字体、不进构建流程。

## 决策

用手动脚本 [scripts/subset-fonts.py](../../scripts/subset-fonts.py) 从钉死的 google/fonts 源文件(已核对与 Google 下发的轮廓、步进、排版、hinting 字节一致)生成子集并提交:每套字体一个预加载的 core(ASCII + 常用标点 + 当前页面已用且原本与 ASCII 同文件的字符)和一个 `unicode-range` 按需加载的 extended(Latin-1、Latin Extended-A 及原 Google latin 文件里的符号)。会改变渲染的选项(去 hinting、收窄可变轴)默认关闭。细节与踩坑见 [专题](../topics/web-fonts.md)。

## 理由

- 自托管才能按用量子集化,同时去掉第三方 CSS 这一跳并让 core 走 `<link rel=preload>`。
- 只在 core 放「当前已用 + 原本同文件」的字符,是逐像素一致与字节的平衡点:放进 extended 的已用字符会失去与 ASCII 的字偶距/亚像素位置并让该页多下 15 KB;原 latin-ext 字符并进 core 又会多出字偶距。
- 备选「构建时子集化」(如 Vite/Astro 插件)被否:用户要求不增加构建步骤,且产物应可审阅、可提交。
- 备选「保留 Google Fonts + preconnect」被否:省不了字节,也去不掉第三方 CSS 一跳。

## 后果

- 每页字体字节 32,372 → 20,268 B(-37%),且两份 core 都预加载;不再请求任何第三方字体源。
- 53 个页面与 Google 原版逐像素一致(1× 全站、2× 关键页);例外仅在于 Google 自己偶发改发的静态实例。
- 代价:内容出现新的非 ASCII 字符或新字重/特性后要重跑 `pnpm fonts` 并提交产物,否则新字符可能回退到系统字体或在 extended 中与 ASCII 分开排版。
- IBM Plex Mono 子集按 OFL 保留名要求改名为 Jade Mono(CSS 族名同步)。
- 可执行约束:脚本自带校验(cmap、垂直度量与 bbox、post 格式、各字重轮廓/步进、全站文本按原分段的排版结果),失败即退出非 0。
