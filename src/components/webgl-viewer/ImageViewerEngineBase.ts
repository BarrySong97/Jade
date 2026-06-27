/**
 * @purpose 定义图像查看器引擎的抽象契约(getScale/zoomAt/loadImage/destroy)
 * @role    模块的引擎基类;被 WebGLImageViewerEngine 继承实现,为未来替换渲染后端预留统一接口
 * @deps    无外部依赖,纯抽象类
 * @gotcha  仅声明方法签名不含实现;新增引擎能力时应先在此扩展抽象方法;模块说明见 docs/modules/components/README.md
 */

export abstract class ImageViewerEngineBase {
  public abstract getScale(): number;
  public abstract zoomAt(x: number, y: number, scale: number, animated?: boolean): void;

  public abstract loadImage(
    url: string,
    preknownWidth?: number,
    preknownHeight?: number,
  ): Promise<void>;

  public abstract destroy(): void;
}
