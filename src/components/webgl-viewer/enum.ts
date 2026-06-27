/**
 * @purpose 定义图像加载阶段枚举(创建纹理 / 图片加载中)
 * @role    模块共享枚举;引擎在 notifyLoadingStateChange 中上报,经 onLoadingStateChange 透传给消费方,并由 index.ts 对外导出
 * @deps    无依赖
 * @gotcha  被 interface.ts 的回调签名引用,枚举顺序变更会影响数值含义;模块说明见 docs/modules/components/README.md
 */

export enum LoadingState {
  CREATE_TEXTURE,

  IMAGE_LOADING,
}
