# components 模块

## 职责

所有 React 组件(Astro 岛)。按特性分子目录;UI 基础件用 shadcn 生成。
**边界**:管「界面组件」;不管数据加载(Astro 页面/content collection 负责)、不管纯逻辑工具(在 `src/lib/`)。

## 子目录与职责

- `ui/` — **shadcn 生成的 vendored 组件**(button/dialog/… 共 50+)。勿手改,用 `pnpm dlx shadcn@latest add` 重新生成;已排除出文件头检查。
- `blogs/` — 文章阅读体验:目录(`Toc.tsx` 桌面 / `MobileToc.tsx` 移动)、代码块(`codeblock.tsx` UI + `code-wrapper-client.tsx` 渐进增强 Shiki `<pre>` + `dynamic-codeblock.tsx` 直传 code)、作者卡 `author-card.tsx`、`blog-image.tsx`(thumbhash 占位 + 懒加载,由图片管线生成,见下方专题)。
- `common/` — 跨页通用:`avatar.tsx`(站点头像)、`cloud-image.tsx`(云图片,见下方专题链接)。
- `layout/` — `header.tsx`(sticky 顶栏)、`footer.tsx`(版权页脚)。
- `showcase/` — `/products` 与 `/photos` 展示页(详见下方子页)。
- `webgl-viewer/` — WebGL 图片查看器引擎(缩放/平移/LOD/瓦片纹理),用于看大图(详见下方子页)。

## 数据流

- 站点组件:Astro 页面读 content collection / `src/lib` 数据 → 以 props 传入岛 → `client:load` 等指令水合。
- 展示页:数据写死在 `showcase/*-data.ts`,组件纯展示。

## 对外接口

- 组件以默认导出为主,经 `@/components/...` 别名引入;`webgl-viewer/index.ts` 是该子模块的公共入口(聚合导出)。

## 注意事项

- 文件级细节看各文件**文件头**(`@purpose/...`),本文件不重复。
- 红线:`ui/` 勿手改;展示页勿耦合站点 Header/Footer/BaseLayout(见 [AGENTS.md](../../../AGENTS.md))。
- 样式优先 Tailwind;字体任意值用 `font-[family-name:var(--x)]`。

## 子页

- [showcase](./showcase.md) — 作品集 / 摄影两个展示页的结构、令牌与交互联动
- [webgl-viewer](./webgl-viewer.md) — 图片查看器引擎的分层与不变量
- 博客图片管线(跨 scripts/components):[docs/topics/blog-images.md](../../topics/blog-images.md)
- 云图片专题(跨 components/lib):[docs/cloud-image-component.md](../../cloud-image-component.md) · [上传规格](../../cloud-image-upload-spec.md)
