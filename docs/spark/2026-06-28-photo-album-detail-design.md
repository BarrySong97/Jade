# 摄影集详情页 — 设计文档

> 状态:已与用户确认,待实现。
> 日期:2026-06-28

## 概述

摄影展示页 `/photos` 现在是图集**列表页**(横向照片流 + 底部日期拨盘,纯展示)。本设计为它增加**图集详情页**:点击某个图集的封面,进入该图集详情,用 **View Transitions 共享元素转场**让被点的封面"原地不动 → 居中",其余照片随后淡入。

## 目标

- 每个图集一个 **SEO 友好的真路由** `/photos/<slug>`(SSG 构建,可直接访问 / 分享 / 抓取,前进后退天然可用)。
- 列表 ↔ 详情**复用同一套横向流交互**(滚动 / 拖拽 / 吸附居中)。
- **进入转场**:封面作为共享元素 morph 到详情居中位,其余照片淡入;**返回**反向。
- 详情底部拨盘保留"中心指针 + 刻度"的视觉语言,读数从日期换成「**第几张 / 共 N 张**」。

## 非目标(YAGNI)

- 每张照片单独的标题 / 说明;图集的地点等额外字段。
- 真实图片管线(现阶段沿用占位渐变 `duo`;真实图后续按 BlogImage 思路另接)。
- 相册网格页或其他浏览方式。
- 非 Chromium 浏览器的 morph(优雅降级,见下)。

## 数据模型(`photography-data.ts`)

把扁平的 `PHOTOS` 重构为「图集」数组:

```ts
interface Album {
  slug: string;   // 路由用:/photos/<slug>
  title: string;  // 图集名(列表卡片 + 详情标题)
  date: string;   // 代表日期(列表的日期拨盘按它排序 / 定位),YYYY-MM-DD
  photos: Photo[]; // 有序;photos[0] = 封面(列表展示那张、详情第一张)
}
interface Photo {
  ar: number;            // 宽高比
  duo: [string, string]; // 占位双色调渐变(接真实图时换 src)
}
```

- 导出 `ALBUMS: Album[]`(取代 `PHOTOS`),按 `date` 倒序(与拨盘时间轴一致)。
- 派生 `COVERS`(给列表用):`ALBUMS.map(a => ({ ...a.photos[0], slug: a.slug, title: a.title, date: a.date }))`。
- 占位数据:把现有 14 条改造成若干图集,每个图集放数张占位照片(示例内容)。
- `fmtDate` / 拨盘几何常量沿用。

## 路由

- `/photos`(现有 `src/pages/photos.astro`):**列表页**。
- `/photos/[album]`(新 `src/pages/photos/[album].astro`):**详情页**;用 `getStaticPaths()` 从 `ALBUMS` 为每个 slug 构建一个静态页。
- 两个路由都用 `ProductsLayout`(已含 `ClientRouter` 与全局 View Transitions)。

## 组件结构

现 `photography.tsx` 是一个写死 `PHOTOS` + 日期拨盘的大组件。抽成一套复用:

- **`photo-stream.tsx`(新,复用核心)**:横向照片流 + 居中 + 拖拽 / 滚轮转横向 / 吸附 + 底部拨盘。props:
  - `items`:要展示的条目(含 `ar`/`duo`;列表项再带 `slug`/`title`)。
  - `dialMode: "date" | "index"`:拨盘读数模式。
  - `initialIndex`:初始居中项(列表:上次/首项;详情:0=封面)。
  - `backHref`、`title`、`count`:顶栏左返回链接 / 中标题 / 右帧数。
  - 每项的渲染:列表项是 `<a href="/photos/<slug>">`,详情项是纯展示。
  - 焦点 / 封面项的 `view-transition-name`(见转场)。
- **列表 `photography.tsx`(`/photos`)**:`<PhotoStream items={COVERS} dialMode="date" title="PHOTOGRAPHS" backHref="/" />`,每个封面是跳 `/photos/<slug>` 的链接。
- **详情(`/photos/[album]`)**:`<PhotoStream items={album.photos} dialMode="index" initialIndex={0} title={album.title} backHref="/photos" />`(以 client island 挂载)。

> 把现有 `photography.tsx` 的命令式滚动 / 拨盘逻辑搬进 `photo-stream.tsx`;`photography.tsx` 变薄、只配置列表数据。

## 转场:View Transitions 共享元素(核心)

- 给**封面图**设唯一 `view-transition-name = cover-<slug>`(React 里用内联 `style={{ viewTransitionName: ... }}`)。列表里它在自己的卡位,详情里它是第一张图。
- 导航 `/photos → /photos/<slug>`(`ClientRouter` 走 SPA View Transition):浏览器把这张封面**从"列表位置 / 尺寸"morph 到"详情居中位置"** → 这就是「原地不动 → 居中」(本就居中则几乎不动)。其余照片(无共享名)走默认 VT **淡入** = 「后面排着的加载出来」;底部拨盘一起过渡。
- 整个是**一次协调动画**(封面 morph + 其余淡入同时)。可选调优:给非封面项加 `animation-delay`,更贴近"先定住再展开"。
- **返回**:详情顶栏「← 返回」→ `/photos`,VT 反向,封面 morph 回它在列表中的卡位。
- 命名唯一性:同一文档同一时刻 `view-transition-name` 不能重复;每个封面用各自 `cover-<slug>`(slug 互不相同),安全。

## 详情页 UI

- 复用列表横向流;**封面 = 第一张,初始居中**(岛挂载即设 `scrollLeft` 居中 `photos[0]`)。
- 底部拨盘:保留中心指针 + 刻度视觉,读数改为「`i+1 / N`」(跟随居中那张)。
- 顶栏:左「← 返回」(去 `/photos`)、中 `album.title`、右「N 帧」。

## 关键实现注意点(留给实现阶段)

1. **详情居中时机**:VT 捕获新页快照时,封面应**已在中心**,否则 morph 终点错位。需让详情首帧(SSR / 水合前)就把封面居中——可在岛初始化同步设 `scrollLeft`,或用 CSS 在首帧定位,避免"水合后才居中"。
2. **`view-transition-name` 唯一性**:见上;列表每个封面名各异(按 slug)。
3. **拨盘读数参数化**:`dialMode="date"` 用 `fmtDate`;`"index"` 用「序号 / 总数」。把读数函数抽成参数。
4. **与立方体转场不冲突**:`cube-transition.astro` 只对 `/ ↔ /products|/photos` 打 `data-vt`;`/photos → /photos/<slug>` 不匹配 → `data-vt=""` → 不会套用立方体,留给共享元素 VT。实现时确认两套 VT 互不干扰。
5. **降级**:非 Chromium(无 VT)→ 直接整页跳转(真路由,功能不受影响);`prefers-reduced-motion` → 关闭 morph。
6. **返回滚动位置**:返回列表时,理想是该图集封面回到它原来的卡位 / 滚动位;`ClientRouter` 的滚动恢复行为需实测,必要时手动恢复。

## 涉及文件(实现时)

- 改 `src/components/showcase/photography-data.ts`:`PHOTOS` → `ALBUMS` + 派生 `COVERS`。
- 新 `src/components/showcase/photo-stream.tsx`:抽取的复用横向流 + 拨盘。
- 改 `src/components/showcase/photography.tsx`:列表,改用 `PhotoStream`,封面加链接 + `view-transition-name`。
- 新 `src/pages/photos/[album].astro`:详情路由 + `getStaticPaths` + 挂 `PhotoStream` 岛。
- 改 `src/styles/showcase.css`:详情拨盘 / 转场相关样式(`view-transition-name` 可内联,不一定动 CSS)。
- 改 `docs/modules/components/showcase.md`:补详情页 + 新数据模型 + 转场说明。

## 验收标准

- `/photos` 列表展示各图集封面;点封面进 `/photos/<slug>`,封面 morph 居中、其余淡入。
- 返回反向;**直接访问** `/photos/<slug>` 正常加载;浏览器后退键可用。
- 详情底部拨盘显示「`i / N`」并跟随居中那张。
- `pnpm build` 通过、`node scripts/check-docs.mjs` 0 ❌。
