# webgl-viewer — WebGL 图片查看器

## 这是什么

一个基于 WebGL 的图片查看器引擎(缩放 / 平移 / 双击、LOD 多级细节、瓦片纹理按需加载),用于查看博客里的大图。比纯 `<img>` 复杂,故单列子页。

## 分层与文件

- `index.ts` — 公共入口,聚合导出组件 / 类型 / 枚举。
- `WebGLImageViewer.tsx` — React 封装:管 canvas 生命周期,把 props 装配成引擎配置。
- `ImageViewerEngineBase.ts` — 抽象契约(`getScale/zoomAt/loadImage/destroy` 等)。
- `WebGLImageViewerEngine.ts` — 核心引擎:变换矩阵、手势、LOD 与瓦片调度、渲染。
- `shaders.ts` — 顶点/片段 GLSL 源码 + `createShader` 辅助。
- `texture.worker.js` — Web Worker:后台 fetch/解码图片,按 LOD 与瓦片网格切分,产出 `ImageBitmap` 回传。
- `constants.ts` / `enum.ts` / `interface.ts` / `DebugInfo.tsx` — 默认配置 / 加载阶段枚举 / 类型契约 / 调试浮层。

## 数据流

React 封装 → 实例化 Engine(继承 Base)→ Engine 调度 worker 解码切片 → 上传纹理 → 按变换矩阵渲染。`DebugInfo` 实时读引擎状态展示。

## 注意事项

- `TILE_SIZE` / LOD 层级等几何常量在 **引擎与 worker 之间存在重复**,改一处要同步另一处(见两文件文件头 @gotcha)。
- 文件级细节看各文件文件头,本页只讲分层关系。
