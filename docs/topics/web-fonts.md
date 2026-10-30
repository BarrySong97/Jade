# Web 字体子集(web-fonts)

## 这是什么 / 为什么单独成篇

站点两套字体(正文 Space Grotesk、等宽 IBM Plex Mono)从 Google Fonts 改为**自托管子集**:每套拆成预加载的 core 和按 `unicode-range` 按需加载的 extended。牵涉一个手动脚本、生成的 CSS/JSON、`public/fonts/` 产物和三处 `<head>`,并且有一批「不这样做渲染就会变」的细节,故单列专题。取舍见 [ADR-0013](../decisions/0013-self-hosted-font-subsets.md)。

硬性目标:**与迁出 Google Fonts 前逐像素一致**。任何会改变渲染的优化都默认关闭,只作为脚本开关提供。

## 涉及的文件

- 脚本:[scripts/subset-fonts.py](../../scripts/subset-fonts.py) — 构建 → 抓全站用量 → 子集化 → 校验 → 写产物。依赖由文件头 PEP 723 声明,`uv` 自动安装。
- 产物(**提交进仓库,勿手改**):`public/fonts/*.woff2` + OFL 许可;[src/styles/fonts.css](../../src/styles/fonts.css)(@font-face,由 `global.css` 第一行引入);[src/data/fonts.json](../../src/data/fonts.json)(预加载清单 + 用量报告)。
- 预加载:[font-preloads.astro](../../src/components/font-preloads.astro),放在 HeadSEO、ProductsLayout、og-preview 的 `<head>`。

## 用法 / 何时重跑

```bash
pnpm fonts                         # = uv run scripts/subset-fonts.py(会先 pnpm build)
uv run scripts/subset-fonts.py --no-build   # dist/ 已是最新时省一次构建;dist 里若残留临时页面会被算进用量
```

**需要重跑的情况**(否则新字符会退回系统字体,或在 extended 文件里与 ASCII 分开排版):

- 新文章 / 组件文案出现了新的非 ASCII 字符(引号、×、é、€ …);
- 新用到某个字重、`font-variant-numeric` / `font-feature-settings`、`hyphens: auto`、新的 `lang`;
- 升级字体源(改脚本里钉死的提交和 sha256)。

脚本末尾的校验失败即说明产物与站点不匹配,别提交。重跑后与 Google 原版比较像素,可参考 ADR 里的做法。

## 拆分规则

| 文件     | 内容                                                                                                                           | 加载                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| core     | ASCII + `‘’“”–—…` + 当前页面实际绘制、且原本与 ASCII 同在 Google latin 文件里的字符(目前 Space Grotesk 多 `·×•`,Plex 多 `·©↓`) | 每页都用到的字重 `<link rel=preload>`         |
| extended | Latin-1 + Latin Extended-A + 原 Google latin 文件里的常用符号(€ ™ „ ‹ › † ′ ″ 等) + 其余已用字符 − core                        | `unicode-range` 命中才下载;目前没有页面会下载 |

- 只保留**当年 Google 实际由该字体绘制**的码位(脚本里的 `GOOGLE_COVERAGE`)。`→ ↗ ≠ ← ✅` 等当时就回退到系统字体,补进来字形会变;Google 子集文件本身也缺 U+2010/2012/2015 等(只在 range 里),同理不补。中日韩一直走 PingFang 等系统字体,不变。
- 每个文件的 `unicode-range` 由产物实际 cmap 生成,只列它真的含有的字符。core 与 extended 同属一个 `font-family`,中间不插任何生成的 fallback 字体(插了会让 fallback 抢先绘制 extended 字符)。
- Space Grotesk 是可变字体,但 4 个 `@font-face` 必须保持离散字重 400/500/600/700(同一文件,只下载一次):`font-[450]` 原本匹配到 500 面、以 wght=500 绘制,写成 `font-weight: 400 700` 会变成 450。
- Plex Mono 只有 400 被用到;500/600 的文件照样生成(不用就不下载),避免以后加 `font-medium` 时悄悄变成合成粗体。
- OpenType 特性:只留 Chrome 默认开启且 Google 原版就有的(kern、liga 等)加上 CSS 打开的 `tnum`(`tabular-nums`);`frac`/`numr`/`dnom`/`pnum`、未匹配页面语言的 `locl` 都去掉。

## 踩过的坑(都已固化进脚本和校验)

- **macOS 渲染对字形名和 head bbox 敏感**:fontTools 默认去掉字形名(post format 3)并重算整体 bbox,Plex Mono 小字号在 Chrome/CoreText 下抗锯齿明显变浅,全站 mono 文字像素都不一致。保留字形名(+~0.1–0.3 KB)并 `recalcBBoxes=False` 后完全一致。
- **跨文件不做字偶距**:core 与 extended 是两个字体,Chrome 分段排版。原本同在 Google latin 文件里的字符(×、•、é…)若放进 extended,与相邻 ASCII 的字偶距/亚像素位置会变;反过来把原 latin-ext 的字符(ť、ł…)并进 core 又会**多出**字偶距。脚本按 Google 原分段模拟排版做全站校验。
- **列表标记也是字体字形**:`•` 由正文字体绘制,放在 extended 里会让 13 个页面为一个圆点多下 15 KB。
- **hinting**:Google 给 Windows 下发带 TrueType hinting 的 Plex Mono,给 Mac 下发不带的;自托管只能一份,默认保留(Windows 不变,macOS 忽略 hinting)。`--strip-hinting` 每页再省约 2.7 KB,但会改变 Windows 上 Plex Mono 的渲染。
- **可变轴收窄**:默认值 300 不在实际用到的 400–700 内,收窄会重建默认母版并取整坐标(±1 单位),只省约 0.2 KB。默认不做,`--limit-axes` 开启;收窄必须先子集化再 instancer,反过来 fontTools 会因字形名报 KeyError。
- **产物要确定**:保存时保留 `head.modified`,否则每次运行哈希文件名都变。
- **缓存头**:`public/` 下的文件在 Vercel 默认是 `max-age=0, must-revalidate`,老访客每次都要为字体发一次 304 请求。`vercel.json`(及 `netlify.toml`)给 `/fonts/*.woff2` 设了一年 `immutable`——前提是文件名带内容哈希,脚本输出的命名规则不能去掉哈希。
- **OFL 保留名**:IBM Plex Mono 声明 Reserved Font Name「Plex」,子集是修改版,内部名称表与 CSS 族名都改为 **Jade Mono**;Space Grotesk 无保留名,不改。许可文本随字体放在 `public/fonts/OFL-*.txt`。

## 以后可以考虑

- 把 core 内联进全局样式(省一次请求,代价是 CSS 变大、字体不再单独缓存)。
- 空闲时(`requestIdleCallback`)预取 extended 文件,让以后进入需要它的页面时直接命中缓存。
