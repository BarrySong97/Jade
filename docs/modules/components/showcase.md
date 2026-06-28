# showcase — 作品集 / 摄影展示页

## 这是什么

`/products`(作品集)与 `/photos`(摄影)两个**独立全屏展示页**,从外部设计稿还原而来。它们刻意与博客主体隔离:用空白布局 [ProductsLayout](../../../src/layouts/ProductsLayout.astro),不接 Header/Footer。

## 涉及文件

- 页面入口:[src/pages/products.astro](../../../src/pages/products.astro)(作品集)· [src/pages/photos.astro](../../../src/pages/photos.astro)(摄影)— 各自独立,以 `client:load` 挂载对应组件(`ProductsLayout` 带 `ClientRouter` 参与视图转场)。
- 作品集:`works.tsx`(浅色单主题,无状态)→ `works-intro.tsx`(左栏)/ `work-card.tsx`(瀑布流卡)。
- 摄影:`photography.tsx`(单文件,横向照片流 + 拨盘时间轴)。
- 数据:`works-data.ts` / `photography-data.ts`(类型 + 列表 + 占位)。
- 令牌/字体:[src/styles/showcase.css](../../../src/styles/showcase.css),作用域 `.works-page`(浅色)/ `.photo-page`(浅色)。
- 立方体转场:`cube-transition.astro`(打 `data-vt` 标记)+ [global.css](../../../src/styles/global.css) 的 `::view-transition` 立方体动画。

## 关键设计

- **首页 ↔ 作品/摄影 的立方体转场**:用 Astro View Transitions(两边 `ClientRouter`),把首页与展示页当作立方体相邻两面,**绕 X 轴(纵向)转 90°**——作品=从上往下(`data-vt="down"`)、图片=从下往上(`up`),返回各自反向(配方 `perspective(1600px) translateZ(-50vh) rotateX(θ) translateZ(50vh)`,当前面落到 z=0 满屏,见 [global.css](../../../src/styles/global.css))。`cube-transition.astro` 在 `astro:before-preparation` + `astro:after-swap` 给 `<html>` 打 `data-vt`(**ClientRouter 交换会用新文档 html 属性擦掉它,所以必须在 after-swap 补一次**,否则动画阶段选不中、退回默认淡入);CSS 据此只对「首页↔展示页」生效,其余导航走默认淡入。为让整页作为一个面整体转动,[BaseLayout](../../../src/layouts/BaseLayout.astro) 去掉了 header/footer 的 `transition:persist` 与 main 的 fade。**两页之间不互相切换**——转场只在「首页 ↔ 作品/摄影」发生。
- **作品集**:仅浅色单主题(已移除原暗房/留白/纸感三主题切换与 theme-switch 组件)。
- **拨盘联动**(摄影):照片流横向滚动 ↔ 底部刻度时间轴,靠 `photography.tsx` 里一个命令式 `useEffect` 直接改多个 ref 的 `style`(绕过 React 渲染),含滚轮纵转横、松手吸附。**这是个内聚交互控件,不宜拆散**(拆开要把一堆 ref 当 props 传,更难读)。

## 注意事项

- Tailwind 4 字体族任意值必须 `font-[family-name:var(--serif)]`(漏 `family-name:` 字体不生效——一次真实失败)。
- 占位图(色块 / 渐变)是临时的:`work-card` 把占位 `<div>` 换成 `<img>`、`photography` 同理,并在对应 `*-data.ts` 加 `src` 字段即可接真实图。
- 两页只各有一个「← 回到博客」(`/`),不互相跳转。
