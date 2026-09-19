# 测试 & 验证策略

> 现状:本仓库是静态个人博客,页面验证以「真跑」为主。维护脚本已有 Node 内置测试，见下方 Stop hook 回归测试。

## 原则

- **真跑验证**:不要只读代码就收工。改完跑 `pnpm build`,再用浏览器打开受影响页面确认。
- **返回结构化文本**:用 agent-browser 读无障碍树 / DOM / 控制台,别只靠截图肉眼判断。
- **聚焦受影响路径**:博客列表、文章页、`/products`、`/photos` 各自独立,只验证你动到的那条。

## 验证某个改动是否真生效

- 构建:`pnpm build` 必须通过(含类型检查)。
- 起服务:`pnpm dev`,记下实际端口(可能 4321/4322…)。
- 用浏览器看页面:
  - 首页 `/` — 简介行 + 按年份归档的文章列表 + 版权信息之后的全宽草甸。
  - 文章页 `/blogs/<slug>` — 正文、代码块复制/折叠、TOC、云图片加载。
  - `/products` — 左栏简介 + 瀑布流 + 右下角三主题切换。
  - `/photos` — 横向照片流 + 底部拨盘时间轴(滚动/拖动联动)。
- 交互逻辑(如摄影页拨盘联动、webgl-viewer 缩放)无法靠读代码确认,必须真操作一遍。

## 什么时候补自动化测试

- 引入纯逻辑工具(如 `src/lib/` 下新算法、cloud-image Key 解析规则)→ 加单元测试。
- 引入测试框架时:Web E2E 用 Playwright CLI / agent-browser(读无障碍树,确定性、可进 CI),并把测试命令接进 `pnpm check` 或 pre-commit 才算真强制。

## 完成闸门

- 收尾跑 `node scripts/check-docs.mjs`(0 ❌)+ `pnpm check`。
- 已装 Stop hook(见 [.claude/settings.json](../.claude/settings.json) 和 [.codex/hooks.json](../.codex/hooks.json)),文档检查会在收尾自动跑 `check-docs --hook`。成功时 stdout 必须是 JSON；有 ❌ 时诊断只写 stderr，以 `exit 2` 拦截收尾。

## Stop hook 回归测试

- `pnpm test:hooks` 使用 Node 内置 `node:test`，并已接入 `pnpm check`。
- 在临时目录中真实运行检查器，覆盖成功 JSON、普通 CLI 文本报告、缺文件头、失效链接、非阻断漂移警告和严格模式；同时校验两个 Agent 的 Stop 配置仍调用被测入口。
- 测试先解析完整 stdout，防止在 JSON 前后混入日志；失败场景验证退出码 `2` 与 stderr 的修复说明，防止为了消除报错而失去检查能力。
- 本次回归作用于命令行 hook 协议，没有受影响的网页；用实际子进程输出与退出码验收。

## 首页草甸回归

- `pnpm test:meadow` 已接入 `pnpm check`，覆盖共享排布与预览一致、90% 株数、种子稳定、空尺寸与首页独有的挂载边界（ADR-0006）。
- 浏览器检查桌面和窄屏底边、微风变化、屏外暂停、减少动态效果静止；通过站内链接进入文章再回首页，确认旧元素清理且新元素恢复动画。
- WebGL 不可用时检查静态位图组合仍显示；生产构建的其他路由不能含草甸元素或草甸脚本。
