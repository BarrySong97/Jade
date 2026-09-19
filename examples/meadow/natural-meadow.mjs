/**
 * @purpose 保留草甸预览的自然排布入口
 * @role 共享纯函数的兼容导出
 * @deps src/lib/meadow-layout.mjs
 * @gotcha 浏览器和 Node 使用同一相对路径，预览服务显式映射此地址
 */
export { arrangeNaturalMeadow } from "../../src/lib/meadow-layout.mjs";
