# 运行手册

## 环境要求

- 运行时:Node ≥ 20
- 包管理:**pnpm**(仓库以 pnpm 为准;别混用 npm/yarn 改 lockfile)
- 其他依赖:无数据库 / 无后端;图片走云存储 CDN(见 [cloud-image-component.md](cloud-image-component.md))

## 安装

```bash
pnpm install
```

## 本地启动

```bash
pnpm dev          # = astro dev
```

- 访问地址:`http://localhost:4321`(端口被占用时 Astro 会自动 +1,如 4322,看启动日志)
- 无需环境变量

## 构建 / 预览

```bash
pnpm build        # = astro build,产物在 dist/(同时做类型感知构建)
pnpm preview      # 本地预览生产构建
```

## Lint / 格式化

```bash
pnpm lint         # oxlint
pnpm format       # oxfmt(原地格式化)
pnpm check        # oxlint && oxfmt,收尾跑这个
```

> 没有独立的 `typecheck` 脚本;`pnpm build` 即包含类型检查。

## 文档同步检查(收尾必跑)

```bash
node scripts/check-docs.mjs          # 0 ❌ 才算过
node scripts/check-docs.mjs --strict # 把 ⚠️ 也当失败
```

## 博客图片管线(压缩 + 传 R2 + 生成占位)
```bash
cp .env.example .env        # 首次:填入 R2 账户/Key/桶/公开域名(.env 已 gitignore)
pnpm img <slug> --dry-run   # 演练:压缩/命名/thumbhash,不上传不改写
pnpm img <slug>             # 实跑:压缩→传 R2→把 ![]() 改写成 <BlogImage/>
```
> 详见专题 [topics/blog-images.md](topics/blog-images.md)。

## 加 shadcn 组件

```bash
pnpm dlx shadcn@latest add <component>   # 生成到 src/components/ui/(vendored,勿手改)
```

## 常用脚本

- `node scripts/check-docs.mjs` — AI 文档系统防漂移检查器(缺文件头 / 失效引用 / 模块漂移)
- `scripts/fetch-hero-images.ts` — 拉取/处理文章封面图的一次性脚本
