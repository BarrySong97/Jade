/**
 * @purpose webgl-viewer 模块的公共入口，统一对外导出查看器组件、类型与枚举
 * @role    模块对外门面;被博客图片查看场景 import,内部聚合并 re-export WebGLImageViewer / interface 类型 / LoadingState 枚举
 * @deps    ./WebGLImageViewer、./interface、./enum
 * @gotcha  外部只应从此入口引入,勿深引内部文件;模块说明见 docs/modules/components/README.md
 */

export { LoadingState } from "./enum";
export type {
  AlignmentAnimationConfig,
  DebugInfo,
  DoubleClickConfig,
  PanningConfig,
  PinchConfig,
  VelocityAnimationConfig,
  WebGLImageViewerProps,
  WebGLImageViewerRef,
  WheelConfig,
} from "./interface";
export { WebGLImageViewer } from "./WebGLImageViewer";
