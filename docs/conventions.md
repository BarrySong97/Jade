# 编码规范

## 命名

- 文件 / 目录:`kebab-case`(如 `work-card.tsx`、`cloud-image-utils.ts`);少数历史 React 组件用 `PascalCase` 文件名(如 `Toc.tsx`、`WebGLImageViewer.tsx`),改动时就近一致即可,新文件优先 kebab-case。
- 变量 / 函数:`camelCase`
- 类型 / 接口 / React 组件:`PascalCase`
- 常量:`UPPER_SNAKE`(模块内样式串/数据表常量如 `LINK`、`KICKER`、`PALETTES` 沿用现有写法)

## 目录与结构

- `src/components/ui/` — shadcn 生成组件,**vendored,勿手改**(见 AGENTS.md 红线)。
- `src/components/<feature>/` — 自有组件,按特性分目录(blogs / common / layout / showcase / webgl-viewer)。
- `src/components/showcase/` — `/products`、`/photos` 展示页;数据与类型集中在 `*-data.ts`,组件纯展示。
- `src/lib/` — 无 UI 的工具/配置(`cn()`、站点信息、云图片工具等)。
- `src/layouts/` Astro 布局 · `src/pages/` 文件路由 · `src/content/blog/` MDX 文章 · `src/styles/` 全局与展示页样式。
- 路径别名:`@/*` → `src/*`(如 `@/components/ui/button`、`@/lib/utils`)。
- 每个源文件顶部必须有 **AI 文件头**(`@purpose/@role/@deps/@gotcha`),见 [scripts/check-docs.mjs](../scripts/check-docs.mjs) 检查;`.astro` 文件不强制。

## 样式约定(重点)

- **Tailwind 优先**:能用工具类(含任意值 `[...]`)表达的,就别写自定义 CSS。自定义 CSS 只留给「无法用 Tailwind 表达」的部分(设计令牌、字体 `@import`、`@theme`)。
- Tailwind 4 经 Vite 插件接入(非 PostCSS);全局令牌/主题在 [src/styles/global.css](../src/styles/global.css),用 OKLCH 色彩空间。
- 暗色模式靠 html 上的 `.dark` class(存 localStorage);自定义变体:`dark:`、`fixed:`。
- 字体族任意值必须写 `font-[family-name:var(--x)]`(漏 `family-name:` 不生效)。
- 展示页(showcase)令牌独立在 [src/styles/showcase.css](../src/styles/showcase.css),作用域 `.works-page` / `.photo-page`,**不与站点主题耦合**。

## React in Astro

- 交互组件作为「岛」用 `client:load` 等指令水合;静态内容保持纯 Astro/HTML。

## 提交规范

- 格式:`type(scope): subject`(type:feat/fix/docs/refactor/test/chore)
- 一次提交一件事,信息说清「为什么」;别夹带无关重构。

## Ratchet(棘轮)

- agent 犯了错别只修这一处——固化成一条 lint 规则 / 文件头 / ADR,保证同样的错不再犯。
- 能用确定性工具(oxlint / 构建 / check-docs)强制的,就别只写进文档。

---

# 术语表

| 术语        | 标识符                         | 含义                                                   |
| ----------- | ------------------------------ | ------------------------------------------------------ |
| 岛 / island | `client:load`                  | Astro 中需要水合的交互式 React 组件                    |
| 展示页      | `showcase`                     | `/products` 作品集 + `/photos` 摄影,独立全屏布局       |
| 云图片      | `CloudImage` / `cloud-image-*` | 按 Key 拼 CDN URL、带 BlurHash 占位的图片组件与工具    |
| 文件头      | AI file header                 | 源文件顶部 `@purpose/...` 注释,给 agent 看的轻量元信息 |

---

# 评审自查清单(收尾前对照)

- [ ] 改动小而内聚,没有夹带无关重构
- [ ] 命名、风格与周边代码一致;样式优先用了 Tailwind
- [ ] 没有违反 AGENTS.md 的红线(未手改 `ui/`、展示页未耦合站点布局)
- [ ] 涉及文件的 AI 文件头已更新
- [ ] 对应 `docs/modules/<module>/` 已同步;决策性改动已补 ADR
- [ ] `pnpm build` 通过、受影响页面已在浏览器真跑确认
- [ ] `node scripts/check-docs.mjs` 无 ❌、`pnpm check` 干净
