# components 模块

## 职责

界面组件，包括 React 岛、静态 Astro 组件和原生浏览器渐进增强。按特性分子目录;UI 基础件用 shadcn 生成。
**边界**:管「界面组件」;不管数据加载(Astro 页面/content collection 负责)、不管纯逻辑工具(在 `src/lib/`)。

## 子目录与职责

- `ui/` — **shadcn 生成的 vendored 组件**(button/dialog/… 共 50+)。勿手改,用 `pnpm dlx shadcn@latest add` 重新生成;已排除出文件头检查。
- `blogs/` — 文章阅读体验:目录(`Toc.tsx` 桌面 / `MobileToc.tsx` 移动)、代码块(`codeblock.tsx` UI + `code-wrapper-client.tsx` 渐进增强 Shiki `<pre>` + `dynamic-codeblock.tsx` 直传 code)、作者卡 `author-card.tsx`、`blog-image.tsx`(thumbhash 占位 + 懒加载 + 点击放大灯箱,由图片管线生成,见下方专题;可选 `caption` / `source` / `sourceUrl` 渲染图下小标题——灰色居中、比正文小一档,`caption` 同时当 `alt`,**图片出处一律写这里,别再在图下另起 `> 来源:…` 引用块**)、`image-strip.tsx`(横向图片条:一排图等高、宽度各按比例,横滚查看;逐张复用 `BlogImage`,条内不放文字,说明单独写在条子下方。`images` 数组要手写——`pnpm img` 只产出 `<BlogImage>` 标签,誊进数组即可);引用卡片 `reference-card.astro`(共用骨架)+ `post-card.astro`(站内,默认紧凑档)/ `link-card.astro`(站外,有 og:image 则大图档),纯 Astro 非岛,只有光标跟随球一小段原生 `<script>`,见下方专题;短视频嵌入 `tiktok-embed.astro` / `bilibili-embed.astro`(官方播放器 iframe,不引第三方 embed.js,见 ADR-0003 与 ADR-0005)。
- `common/` — 跨页通用:`avatar.tsx`(站点头像)、`cloud-image.tsx`(云图片,见下方专题链接)。
- `home/` — 首页内容:`profile-intro.astro`(宽屏左文右图，手机人物图靠左置顶、简介随后)、`post-archive.astro`(按年份归档的文章列表)、`home-meadow.astro`(首页最底部全宽花草，详见下方)。
- `layout/` — `header.tsx`(sticky 顶栏)、`footer.tsx`(版权信息、标语与博客 Git 仓库入口)。
- `showcase/` — `/products` 与 `/photos` 展示页(详见下方子页)。
- `webgl-viewer/` — WebGL 图片查看器引擎(缩放/平移/LOD/瓦片纹理),用于看大图(详见下方子页)。

## 数据流

- 站点组件:Astro 页面读 content collection / `src/lib` 数据 → 以 props 传入岛 → `client:load` 等指令水合。
- 展示页:数据写死在 `showcase/*-data.ts`,组件纯展示。

## 对外接口

- 组件以默认导出为主,经 `@/components/...` 别名引入;`webgl-viewer/index.ts` 是该子模块的公共入口(聚合导出)。

## 系列归档

- 文章 frontmatter 可选 `series`，由 [内容 schema](../../../src/content.config.ts) 校验已注册标识。[文章布局](../../../src/layouts/BlogPost.astro) 在阅读时长后显示系列名称链接，元信息支持窄屏换行；无系列时不显示入口。
- [系列页](../../../src/pages/series/[series].astro) 在 `/series/:series` 只生成包含文章的系列，并复用 `home/post-archive.astro` 的 `posts` prop，按年份、新文章优先排列；首页不传 prop，仍显示全部文章。系列页使用 BaseLayout，不挂载首页草甸。
- 首个系列为「炒股日记」，包含两篇炒股月记；系列标题与描述在 `src/lib/series.ts` 维护。
- 系列目录可选 `heroImage`，显示在返回链接与系列标题之间，并用于分享预览。提供 `heroWidth` / `heroHeight` 时复用博客 `BlogImage`（可选 `heroThumbhash`，不开灯箱）；只提供地址时显示普通响应式图片。省略封面时不生成图片区、不预留空白，当前炒股日记默认无封面。

## 首页头像

首页简介在「这是我的作品」后显示「更多关于我的内容」，其中「关于我」链接到 [关于页](../../../src/pages/about.astro) `/about`。

关于页沿用 BaseLayout、首页 680px 版心和墨白令牌，包含姓名、无标题长简介、经历与教育，不设「找到我」社交模块。姓名下显示「1997 年生 / 贵阳」，不展示职业称谓。桌面使用 104px 时间/栏目栏，简介正文保持右栏对齐；手机堆叠。章节只靠留白区分，不加分隔线。内容集中在 `src/lib/about.ts`，姓名与所在地复用 `PROFILE`；经历与学历暂为用户授权的虚构示例，页面保留说明，替换真实资料后再去掉。纯 Astro，无新增客户端交互，不挂载草甸。

[profile-intro.astro](../../../src/components/home/profile-intro.astro) 使用用户在 [独立 demo](../../../examples/portrait/README.md) 确认的黑白三渲二原画 `portrait-monochrome-v2.png`，由 Astro Image 构建为 424px、quality 90 的 WebP，显示宽度沿用桌面 212px / 手机 190px，原有排版与平移不变。素材与预览共享同一张 PNG，仅首页替换；原线稿保留供 demo 对照与现有 OG 预览引用，通用头像和作品集头像不受影响。

## 首页草甸

- [home-meadow.astro](../../../src/components/home/home-meadow.astro) 只由 [首页](../../../src/pages/index.astro) 传入 BaseLayout 的 `page-end` 插槽，位于版权 Footer 之后；通用 Footer、文章及展示页不挂载它。高度手机 176px、宽屏 240px，画布铺满页面宽度，植物根部贴底。
- 构建期用 Astro `getImage` 将选定的 11 张植物原画缩至最长边 640px、WebP quality 82；杏黄/蓝紫蝴蝶的振翅及停驻四张图集缩至 1024×512、quality 88。静态回退用 SVG 排列原画与两只蝴蝶，脚本不可用或 WebGL 失败时仍显示。
- [home-meadow-client.js](../../../src/components/home/home-meadow-client.js) 注册自定义元素，接近视口时解码素材、创建 WebGL；画面可见且页面在前台才运行微风。减少动态效果时静止，离开首页时释放监听器、动画帧和 GPU 资源，支持 ClientRouter 往返。
- [meadow-renderer.js](../../../src/components/home/meadow-renderer.js) 是首页与设计预览的共同真源；透明植物通过固定根部的二维网格轻微弯曲，新增可选图集采样/旋转供两只蝴蝶使用，仍只有一个 WebGL 上下文与时钟。自然排布来自 `src/lib/meadow-layout.mjs`，不在每帧重新随机；`meadow-wind.mjs` 统一植物风动与花头接触投影。
- 页面边界和排布回归由 `pnpm test:meadow` 强制，见 [ADR-0006](../../decisions/0006-home-meadow.md)。
- 用户决定首页只放花草和两色蝴蝶；猫与追逐逻辑留在 [原花草 demo](../../../examples/meadow/chase/README.md)。首页通过 `meadow-butterflies.mjs` 使用不同路线/频率、29/37 秒周期和不同候选花株，飞行、落花、起飞衔接，停驻跟随花头。没有控件、鼠标追逐或猫资源，见 [ADR-0010](../../decisions/0010-home-butterflies.md)。

## 注意事项

- 文件级细节看各文件**文件头**(`@purpose/...`),本文件不重复。
- 红线:`ui/` 勿手改;展示页勿耦合站点 Header/Footer/BaseLayout(见 [AGENTS.md](../../../AGENTS.md))。
- 样式优先 Tailwind;字体任意值用 `font-[family-name:var(--x)]`。

## 子页

- [showcase](./showcase.md) — 作品集 / 摄影两个展示页的结构、令牌与交互联动
- [webgl-viewer](./webgl-viewer.md) — 图片查看器引擎的分层与不变量
- 博客图片管线(跨 scripts/components):[docs/topics/blog-images.md](../../topics/blog-images.md)
- 引用卡片(跨 scripts/components/lib):[docs/topics/link-cards.md](../../topics/link-cards.md)
- 云图片专题(跨 components/lib):[docs/cloud-image-component.md](../../cloud-image-component.md) · [上传规格](../../cloud-image-upload-spec.md)
