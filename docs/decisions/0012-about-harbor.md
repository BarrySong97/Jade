# 0012. 工业海港仅挂载 About，预览与生产共享渲染

- 状态：已采纳
- 日期：2026-10-02

用户确认工业港口 Demo 并要求接入页面。About 单独通过 BaseLayout 的 page-end 插槽，在 Footer 后挂载 AboutHarbor。首页草甸和隔离展示页不变。

纯排布/动作迁到 `src/lib/harbor-scene.mjs`，Canvas 真源迁到 `src/components/about/harbor-renderer.js`，独立 Demo 共用，避免复制后视觉分叉。正式页不加载按钮或进度控制；五张已确认 PNG 在构建时转 WebP，静态港口作为无脚本/失败回退。

自定义元素处理懒初始化、屏外/后台暂停、减少动态、ClientRouter 断开清理。`scripts/harbor.test.mjs` 强制仅 About 挂载、共享纯函数及既有航迹/图集/移动边界。
