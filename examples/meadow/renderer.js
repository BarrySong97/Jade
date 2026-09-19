/**
 * @purpose 保留草甸预览的渲染器入口
 * @role 首页共享引擎的兼容导出
 * @deps src/components/home/meadow-renderer.js；preview.mjs 提供明确的共享源码路由
 * @gotcha 渲染器真源在 src，避免预览与首页风动效果漂移
 */
export { createRenderer, loadPlant } from "../../src/components/home/meadow-renderer.js";
