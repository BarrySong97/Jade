/**
 * @purpose 集中定义查看器各交互配置项(滚轮/手势/双击/平移/动画)的默认值
 * @role    模块默认配置源;被 WebGLImageViewer.tsx 用来与外部 props 合并成完整 config 传给引擎
 * @deps    ./interface(各 Config 类型定义)
 * @gotcha  仅默认值无逻辑;改默认行为在此调整,组件用展开运算覆盖;模块说明见 docs/modules/components/README.md
 */

import type {
  AlignmentAnimationConfig,
  DoubleClickConfig,
  PanningConfig,
  PinchConfig,
  VelocityAnimationConfig,
  WheelConfig,
} from "./interface";

/**
 * 默认滚轮配置
 */
export const defaultWheelConfig: WheelConfig = {
  step: 0.1,
  wheelDisabled: false,
  touchPadDisabled: false,
};

/**
 * 默认手势缩放配置
 */
export const defaultPinchConfig: PinchConfig = {
  step: 0.5,
  disabled: false,
};

/**
 * 默认双击配置
 */
export const defaultDoubleClickConfig: DoubleClickConfig = {
  step: 2,
  disabled: false,
  mode: "toggle",
  animationTime: 200,
};

/**
 * 默认平移配置
 */
export const defaultPanningConfig: PanningConfig = {
  disabled: false,
  velocityDisabled: true,
};

/**
 * 默认对齐动画配置
 */
export const defaultAlignmentAnimation: AlignmentAnimationConfig = {
  sizeX: 0,
  sizeY: 0,
  velocityAlignmentTime: 0.2,
};

/**
 * 默认速度动画配置
 */
export const defaultVelocityAnimation: VelocityAnimationConfig = {
  sensitivity: 1,
  animationTime: 0.2,
};
