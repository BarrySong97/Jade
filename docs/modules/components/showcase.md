# showcase — 作品集 / 摄影展示页

## 这是什么

`/products`(作品集)与 `/photos`(摄影)两个**独立全屏展示页**,从外部设计稿还原而来。它们刻意与博客主体隔离:用空白布局 [ProductsLayout](../../../src/layouts/ProductsLayout.astro),不接 Header/Footer。

## 涉及文件

- 页面入口:[src/pages/products.astro](../../../src/pages/products.astro)(作品集)· [src/pages/photos.astro](../../../src/pages/photos.astro)(摄影列表)· [src/pages/photos/[album].astro](../../../src/pages/photos/[album].astro)(图集详情,`getStaticPaths` 一图集一页)— 都用 `ProductsLayout`(带 `ClientRouter` 参与视图转场)。
- 作品集:`works.tsx`(浅色单主题,无状态)→ `works-intro.tsx`(左栏)/ `work-card.tsx`(瀑布流卡)。
- 摄影:`photo-stream.tsx`(可复用横向流 + 拨盘,列表与详情共用,`dialMode` 切日期/序号)。
- 数据:`works-data.ts` / `photography-data.ts`(`ALBUMS` 图集 + 派生 `COVERS` + 占位)。
- 令牌/字体:[src/styles/showcase.css](../../../src/styles/showcase.css),作用域 `.works-page`(浅色)/ `.photo-page`(浅色)。
- 转场:`cube-transition.astro`(给 `<html>` 打 `data-vt` 立方体方向 + 给封面瞬时设 `view-transition-name` 共享元素)+ [global.css](../../../src/styles/global.css) 的 `::view-transition` 动画。

## 关键设计

- **首页 ↔ 作品/摄影 的立方体转场**:用 Astro View Transitions(两边 `ClientRouter`),把首页与展示页当作立方体相邻两面,**绕 X 轴(纵向)转 90°**——作品=从上往下(`data-vt="down"`)、图片=从下往上(`up`),返回各自反向(配方 `perspective(1600px) translateZ(-50vh) rotateX(θ) translateZ(50vh)`,当前面落到 z=0 满屏,见 [global.css](../../../src/styles/global.css))。`cube-transition.astro` 在 `astro:before-preparation` + `astro:after-swap` 给 `<html>` 打 `data-vt`(**ClientRouter 交换会用新文档 html 属性擦掉它,所以必须在 after-swap 补一次**,否则动画阶段选不中、退回默认淡入);CSS 据此只对「首页↔展示页」生效,其余导航走默认淡入。为让整页作为一个面整体转动,[BaseLayout](../../../src/layouts/BaseLayout.astro) 去掉了 header/footer 的 `transition:persist` 与 main 的 fade。**两页之间不互相切换**——转场只在「首页 ↔ 作品/摄影」发生。
- **作品集**:仅浅色单主题(已移除原暗房/留白/纸感三主题切换与 theme-switch 组件)。
- **瀑布流持续流动**:`works.tsx` 把 WORKS 轮转分到 3 个显式列,每列内容**复制一份**做无缝循环(`translateY -50%↔0`);**奇数列向下、偶数列向上**(`.works-flow-down/up`,50s 慢速,见 [showcase.css](../../../src/styles/showcase.css));外层 `main` `overflow-hidden` 裁剪视口,`group` 容器 `hover` 时 `group-hover:[animation-play-state:paused]` 暂停所有列;`prefers-reduced-motion` 关闭。
- **拨盘联动**(摄影):照片流横向滚动 ↔ 底部刻度时间轴,靠 `photo-stream.tsx` 里一个命令式 `useEffect` 直接改多个 ref 的 `style`(绕过 React 渲染),含滚轮纵转横、松手吸附。**这是个内聚交互控件,不宜拆散**(拆开要把一堆 ref 当 props 传,更难读)。
- **摄影图集详情 + 共享元素转场**(`/photos` ↔ `/photos/<slug>`):列表每项=一个图集(展示 `photos[0]` 封面),点封面进该图集详情(真路由,SEO 友好)。封面图带 `data-cover="<slug>"`,详情第一张同名;`cube-transition.astro` 在导航前后给这张设 `view-transition-name: photo-cover` → 列表→详情时封面**共享元素 morph**到详情居中位(本就居中则几乎不动),其余照片走默认淡入;返回反向。命名只在该导航期间挂,**不污染立方体转场**(立方体只对首页↔展示页生效)。详情底部拨盘读数由日期改「第几张 / 共 N 张」(`dialMode="index"`);为让封面在 VT 快照时即居中,首/末 spacer 按项宽算,使首项 `scrollLeft=0` 即居中。详见 [docs/spark/2026-06-28-photo-album-detail-design.md](../../spark/2026-06-28-photo-album-detail-design.md)。

## 注意事项

- Tailwind 4 字体族任意值必须 `font-[family-name:var(--serif)]`(漏 `family-name:` 字体不生效——一次真实失败)。
- 占位图(色块 / 渐变)是临时的:`work-card` / `photo-stream` 把占位 `<div>` 换成 `<img>`,并在对应 `*-data.ts` 加 `src` 字段即可接真实图。
- 顶栏返回:作品集 / 摄影列表是「← 回到博客」(`/`);图集详情是「← 返回」(`/photos`)。
