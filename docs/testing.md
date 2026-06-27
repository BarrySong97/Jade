# 测试 & 验证策略

> 现状:本仓库是静态个人博客,**暂无自动化测试套件**。验证以「真跑」为主。本文件给出做法约定,新增复杂逻辑时按此补测。

## 原则

- **真跑验证**:不要只读代码就收工。改完跑 `pnpm build`,再用浏览器打开受影响页面确认。
- **返回结构化文本**:用 agent-browser 读无障碍树 / DOM / 控制台,别只靠截图肉眼判断。
- **聚焦受影响路径**:博客列表、文章页、`/products`、`/photos` 各自独立,只验证你动到的那条。

## 验证某个改动是否真生效

- 构建:`pnpm build` 必须通过(含类型检查)。
- 起服务:`pnpm dev`,记下实际端口(可能 4321/4322…)。
- 用浏览器看页面:
  - 首页 `/` — 简介行 + 按年份归档的文章列表。
  - 文章页 `/blogs/<slug>` — 正文、代码块复制/折叠、TOC、云图片加载。
  - `/products` — 左栏简介 + 瀑布流 + 右下角三主题切换。
  - `/photos` — 横向照片流 + 底部拨盘时间轴(滚动/拖动联动)。
- 交互逻辑(如摄影页拨盘联动、webgl-viewer 缩放)无法靠读代码确认,必须真操作一遍。

## 什么时候补自动化测试

- 引入纯逻辑工具(如 `src/lib/` 下新算法、cloud-image Key 解析规则)→ 加单元测试。
- 引入测试框架时:Web E2E 用 Playwright CLI / agent-browser(读无障碍树,确定性、可进 CI),并把测试命令接进 `pnpm check` 或 pre-commit 才算真强制。

## 完成闸门

- 收尾跑 `node scripts/check-docs.mjs`(0 ❌)+ `pnpm check`。
- 已装 Stop hook(见 [.claude/settings.json](../.claude/settings.json)),文档检查会在收尾自动跑 `check-docs --hook`,有 ❌ 时 `exit 2` 拦截收尾。
