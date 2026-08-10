# showcase — 作品集 / 摄影展示页

## 这是什么

`/products`(作品集)与 `/photos`(摄影)两个**独立全屏展示页**,从外部设计稿还原而来。它们刻意与博客主体隔离:用空白布局 [ProductsLayout](../../../src/layouts/ProductsLayout.astro),不接 Header/Footer。

## 涉及文件

- 页面入口:[src/pages/products.astro](../../../src/pages/products.astro)(作品集列表)· [src/pages/products/[slug].astro](../../../src/pages/products/[slug].astro)(项目详情)· [src/pages/photos.astro](../../../src/pages/photos.astro)(摄影列表)· [src/pages/photos/[album].astro](../../../src/pages/photos/[album].astro)(图集详情)— 都用 `ProductsLayout`(带 `ClientRouter` 参与视图转场)。
- 作品集列表:`works.tsx`(浅色单主题)→ `works-intro.tsx`(左栏 sticky 简介)+ 底角 `works-avatar-bar`(约为首页尺寸 81%、无头像容器的完整手绘肖像 + Blog / Twitter，图片使用 424px WebP 衍生资源)/ `work-card.tsx`(整卡进详情)。只有一张图的作品，封面左上角显示 Web Tag；Tag 是黑灰半透明样式。图标在 `src/assets/works/icons/`,经 `works-icons.ts`。
- 作品集详情:`work-detail.tsx`(左栏项目 Header + 底角同款头像栏 + 右栏静态两列瀑布流;`images[]` 按纵横比贪心装箱;图点击放大复用博客 `BlogImage` 灯箱;每个产品默认第二张图左上角显示 Web Tag，只有一张时显示在第一张)。TEMP:右栏暂塞全部作品图测多图。
- 摄影:`photo-stream.tsx`(可复用横向流 + 拨盘,列表与详情共用,`dialMode` 切日期/序号)。
- 数据:`works-data.ts`(`slug` + `images[]`,`images[0]`=列表封面)/ `photography-data.ts`。官网长截图用 `detailSolo` + 图上 `solo`:详情只渲染该图、关闭封面 morph,列表仍用 `images[0]`。
- 作品图上传:[scripts/upload-asset.mjs](../../../scripts/upload-asset.mjs)(压 WebP → R2,产出填进 `images[]`)。**必须用原文件路径**(如 `~/Downloads/...`),禁止用 Cursor 聊天附件(`.cursor/.../assets/`,会被压到 ~1024px 导致发糊)。
- 令牌/字体:[src/styles/showcase.css](../../../src/styles/showcase.css);`--sans`/`--mono` 指向站点字体。
- 转场:`cube-transition.astro` + [global.css](../../../src/styles/global.css) 的 `::view-transition`。

## 关键设计

- **首页 ↔ 作品/摄影列表 的立方体转场**:Astro View Transitions + `data-vt`(作品=`down`、摄影=`up`);**只对列表页**,不对接 `/products/<slug>` 详情。`cube-transition.astro` 在 `before-preparation` + `after-swap` 打标。
- **作品集列表**:浅色单主题;左栏 sticky 简介 + 右侧两列条目([ADR 0004](../../decisions/0004-works-static-columns.md));分列按封面纵横比贪心装箱。
- **作品集项目详情**(`/products` ↔ `/products/<slug>`):真路由 SSG。左栏顶行「← 返回」+ 右对齐项目图标,其下标题/链接/年份·平台/说明;底角头像与列表共用且**不进文案转场**(单独 `works-avatar` 原地);右栏默认 `images[]` 静态两列瀑布流(首张左上 morph)。`detailSolo` 时右栏只显示 `solo` 图、全宽、两端都不挂 `data-work-cover`。转场:(1) 封面 `work-cover` morph(detailSolo 跳过);(2) 文案块 `works-aside` 进详情旧文右滑出、新文从左入,返回(`data-works-nav=out`)整段反向。命名只在该导航期间挂,**不污染立方体**。`prefers-reduced-motion` 关掉全部 VT 动画。
- **条目排版**——项目名 `14px`/`font-[450]`;说明 `15px`/`leading-[1.7]` 通篇 `--fg-2`。数据支持多图,现阶段每项可先只放一张。
- **列表载入动效**:`.works-rise` 错开上浮。
- **拨盘联动**(摄影):见既有说明。
- **摄影图集详情 + 共享元素转场**(`/photos` ↔ `/photos/<slug>`):`photo-cover` morph;详见 [docs/spark/2026-06-28-photo-album-detail-design.md](../../spark/2026-06-28-photo-album-detail-design.md)。

## 注意事项

- Tailwind 4 字体族任意值必须 `font-[family-name:var(--mono)]`。
- 顶栏返回:列表「← 回到博客」(`/`);作品详情 / 图集详情「← 返回」(`/products` 或 `/photos`)。
- 作品条目:整卡点进详情;外链 URL 单独可点(pointer-events 分层)。新作品要同时加 `slug`、`images[]`、图标文件 + `WORK_ICONS` 键。官网类长截图加 `detailSolo: true` 并在对应图上标 `solo: true`。
- 立方体只绑 `/` ↔ `/products` 与 `/` ↔ `/photos`,别把 `/products/<slug>` 算进去。
