# 0003. 短视频嵌入:自渲染官方 iframe,不引 embed.js

- 状态:已采纳
- 日期:2026-07-26

## 背景

文章末尾要嵌一条 TikTok 短视频。官方给的嵌入代码是一段 `<blockquote class="tiktok-embed">` 加 `<script async src="https://www.tiktok.com/embed.js">`:脚本跑起来后把 blockquote 换成 `<iframe src="https://www.tiktok.com/embed/v2/<id>">`,再监听对方 `postMessage` 回来的高度调整 iframe。

本站是静态站,正文里其他「外部内容」(引用卡片、图片)都遵循同一条哲学:**构建期确定、运行时不做不确定的事**(见 [ADR-0001](./0001-blog-image-pipeline.md) / [ADR-0002](./0002-link-card-cache.md))。

## 决策

做一个 [tiktok-embed.astro](../../src/components/blogs/tiktok-embed.astro),**只写 iframe,不引 embed.js**:

1. 从完整视频链接里正则取出数字 id,直接渲染 `https://www.tiktok.com/embed/v2/<id>`;取不出 id **构建期抛错**。
2. 外层盒子宽 `max-w-[325px]`(TikTok 嵌入页自身锁的宽度)、初始高 **739px**(实测该嵌入页的自然高度)。
3. 加一段十几行的原生 `<script>` 复刻 embed.js 唯一有用的行为:收到 `origin === "https://www.tiktok.com"` 的 `postMessage`(内容形如 `{"signalSource":"","height":739}`)后,按 `contentWindow` 认领对应的盒子改高度;数值校验在 200–2000px 之间才用。
4. 图注给一条「@作者 ↗」的原文链接,当 iframe 因网络原因加载不出时仍有去处。

## 理由

- **不引第三方脚本**:embed.js 会自己往页面塞 DOM、带自己的埋点,还得等它下载完才出画面;而它干的事(插 iframe + 调高度)一共十几行,自己写完全可控,也不受对方脚本改版影响。
- **高度既有兜底又准确**:固定 739px 保证脚本不跑(或消息没来)时不塌、不出现布局跳动;拿到消息再按真实高度调整——不同视频文案行数不同,高度不一样,写死会裁掉底部。
- **校验来自外站的消息**:`origin` + 类型 + 像素范围三重校验,避免把外部消息直接当样式用。
- 与卡片一致的样式隔离:嵌在 `.prose` 里要 `not-prose`,并在 `global.css` 用 `revert-layer` 挡掉手写 `.prose a` 的渐变下划线(同 ADR-0002 的坑)。

## 后果

- 只支持**带数字 id 的完整链接**;`vm.tiktok.com` 短链得先在浏览器展开再填。
- **抖音(douyin.com)是另一套播放器**(`open.douyin.com/player/video?vid=…`),本组件不认;真要嵌抖音再按同样思路加一个分支,别硬塞进 TikTok 的 URL 解析。
- 视频画面依赖 tiktok.com 可访问;墙内读者看到的是空白 iframe + 图注里的原文链接。
- 739px 与 325px 是实测值,若 TikTok 改版需要重测(症状:底部被裁或下方留白)。
