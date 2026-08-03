# 0005. Bilibili 视频嵌入:响应式官方播放器 iframe

- 状态:已采纳
- 日期:2026-08-03

## 背景

文章需要嵌入 Bilibili 视频。Bilibili 的播放器可以由 `player.bilibili.com` 直接创建，本站又是静态站，不希望因为第三方脚本注入 DOM 或依赖运行时初始化。

## 决策

使用 `src/components/blogs/bilibili-embed.astro`，构建期从完整 Bilibili 链接或 BV 号解析视频 ID，直接渲染官方播放器 iframe：

- 播放器地址固定为 `https://player.bilibili.com/player.html?bvid=<BV>&high_quality=1&danmaku=0`。
- 外层使用 Tailwind `aspect-video`，宽度跟随正文，避免写死桌面尺寸。
- `loading="lazy"`、`allowfullscreen` 和严格的 `referrerpolicy` 保留；关闭弹幕减少干扰。
- 解析失败在构建期抛错；图注保留原视频链接，播放器不可访问时仍可跳转原站。

## 理由

这和 TikTok 的 iframe 方案保持一致：构建期确定外链与 DOM，运行时只由浏览器加载播放器，不增加站点 JS 依赖，也不会把第三方脚本的 DOM/埋点带进文章页。

## 后果

- 播放器内容依赖 `bilibili.com` 可访问；受网络限制时仍能通过图注打开原视频。
- 当前统一使用 16:9；若后续遇到竖屏视频，应扩展组件的比例参数，而不是让单篇文章写内联样式。
