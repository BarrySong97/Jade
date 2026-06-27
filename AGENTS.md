# jade — Agent 指南

**是什么**:Barry Song 的个人博客(墨白克制风格)。首页是「简介 + 按年份归档的文章列表」,文章用 MDX 写;另有 `/products` 作品集与 `/photos` 摄影两个独立全屏展示页。
**架构**:静态站(SSG) · Astro 5 + React 岛 + Tailwind CSS 4 + shadcn/ui(`base-vega` / `@base-ui/react`)+ MDX · 包管理 pnpm · 运行见 [docs/run.md](docs/run.md)

## 🚨 红线(不可逾越;每条都标出处)

- **`src/components/ui/` 是 shadcn 生成的 vendored 代码,不手改**——要改用 `pnpm dlx shadcn@latest add <component>` 重新生成(手改会在升级时丢失;已在 [check-docs.config.json](check-docs.config.json) 把 `ui` 排除出文件头检查)。
- **展示页保持隔离**:`/products`、`/photos` 用独立空白布局 [ProductsLayout](src/layouts/ProductsLayout.astro),**不得**接入站点 Header/Footer/BaseLayout;其设计令牌/字体只在 [src/styles/showcase.css](src/styles/showcase.css) 里靠 `.works-page` / `.photo-page` 作用域提供(用户明确要求互不关联)。
- **Tailwind 优先**:能用 Tailwind 工具类表达的就别写自定义 CSS(用户要求);Tailwind 4 下字体族任意值必须写 `font-[family-name:var(--serif)]`,漏掉 `family-name:` 字体不生效(一次真实失败)。
- **收尾必须 `node scripts/check-docs.mjs` 0 ❌**:新增源文件要加 AI 文件头、改了模块代码要同步 `docs/modules/<module>/`(机制见工作流第 6 步)。

## ✅ 工作流(Definition of Done,缺一不算完成)

1. 读相关模块文档 [docs/modules/](docs/modules/)(+ 跨模块专题 [docs/topics/](docs/topics/))+ 待改文件的文件头
2. 大改先写 [docs/plans/](docs/plans/) 计划(Plan → Approve → Execute)
3. 改代码,遵循 [docs/conventions.md](docs/conventions.md)
4. 同步:文件头 + 对应 `docs/modules/<module>/`;决策性改动补一条 [ADR](docs/decisions/)
5. 按 [docs/testing.md](docs/testing.md) **真跑验证**(`pnpm build` + 浏览器看页面,不止读代码)
6. 跑 sensors:`node scripts/check-docs.mjs` + `pnpm check`(oxlint + oxfmt),清掉报错
7. 按 [docs/conventions.md](docs/conventions.md) 提交

> **Ratchet 棘轮**:agent 犯了错,别只修这一处——固化成一条 lint 规则 / 文件头 / ADR,保证同样的错不再犯。

## 📚 导航

- **模块**:[components](docs/modules/components/) · [lib](docs/modules/lib/)
- **专题(跨模块 / 复杂)**:[博客图片管线 docs/topics/blog-images.md](docs/topics/blog-images.md) · 云图片组件(旧) [docs/cloud-image-component.md](docs/cloud-image-component.md) · 上传规格(旧) [docs/cloud-image-upload-spec.md](docs/cloud-image-upload-spec.md)
- 设计系统 [design.md](design.md) · 运行手册 [docs/run.md](docs/run.md) · 规范&术语 [docs/conventions.md](docs/conventions.md)
- 测试&验证 [docs/testing.md](docs/testing.md) · 需求 [docs/specs/](docs/specs/) · 计划 [docs/plans/](docs/plans/) · 决策 [docs/decisions/](docs/decisions/)
