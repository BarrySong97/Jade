# showcase — 作品集 / 摄影展示页

## 这是什么

`/products`(作品集)与 `/photos`(摄影)两个**独立全屏展示页**,从外部设计稿还原而来。它们刻意与博客主体隔离:用空白布局 [ProductsLayout](../../../src/layouts/ProductsLayout.astro),不接 Header/Footer。

## 涉及文件

- 页面入口:[src/pages/products.astro](../../../src/pages/products.astro) · [src/pages/photos.astro](../../../src/pages/photos.astro) — 以 `client:load` 挂载岛。
- 作品集岛:`works.tsx`(根,持有 theme 状态)→ `works-intro.tsx`(左栏)/ `work-card.tsx`(瀑布流卡)/ `theme-switch.tsx`(右下角三主题)。
- 摄影岛:`photography.tsx`(单文件,横向照片流 + 拨盘时间轴)。
- 数据:`works-data.ts` / `photography-data.ts`(类型 + 列表 + 占位)。
- 令牌/字体:[src/styles/showcase.css](../../../src/styles/showcase.css),作用域 `.works-page`(三主题)/ `.photo-page`(单浅色)。

## 关键设计

- **主题切换**(作品集):根节点 `data-theme="dark|light|paper"`,颜色全走 CSS 变量;切换只改属性,不重渲数据。
- **拨盘联动**(摄影):照片流横向滚动 ↔ 底部刻度时间轴,靠 `photography.tsx` 里一个命令式 `useEffect` 直接改多个 ref 的 `style`(绕过 React 渲染),含滚轮纵转横、松手吸附。**这是个内聚交互控件,不宜拆散**(拆开要把一堆 ref 当 props 传,更难读)。

## 注意事项

- Tailwind 4 字体族任意值必须 `font-[family-name:var(--serif)]`(漏 `family-name:` 字体不生效——一次真实失败)。
- 占位图(色块 / 渐变)是临时的:`work-card` 把占位 `<div>` 换成 `<img>`、`photography` 同理,并在对应 `*-data.ts` 加 `src` 字段即可接真实图。
- 两页只各有一个「← 回到博客」(`/`),不互相跳转。
