# 一张 PNG 的微风动画

运行 `pnpm demo:grass`，打开 <http://localhost:55021>。仅监听本机，`Ctrl+C` 停止。依赖项目已有的 Tailwind CSS，无新增依赖；未接入网站的页脚或生产构建。

## 怎么看

1. 左边是原图，右边是同一张图的二维网格变形。
2. 勾选「显示网格」：3 列 × 9 行顶点，形成 32 个三角形。
3. 点击「暂停」，拖动风力，观察图片跟着网格移动、根部绿点固定。
4. 将风力降到 0，图片恢复原始形状；继续播放可看连续变化。

## 制作方式

- `grass.png`：AI 生成的一张透明位图，1145 × 1374，包含真实 alpha 通道。原图笔触和颜色直接参与显示，不转成 SVG，不重绘草的轮廓。
- `demo.js`：读取 alpha 的可见范围，给左右视图使用相同的显示范围。左边 Canvas 2D 画原图；右边 WebGL 贴到二维三角网格。
- 每个顶点的横向位移为 `bend × h²`，`h` 从根部的 0 递增到草尖的 1。根部整行固定，顶部位移最大。纵坐标不变。
- `bend` 是两个缓慢正弦周期的加权和，再乘风力和最大位移。每帧只更新顶点位置，纹理坐标不变；GPU 在三角形内插值采样原图。
- 透明区依然透明；网格线只是一层解释用的 Canvas 2D 叠加，不属于素材。使用预乘 alpha 混合，避免透明边缘发黑。
- 页面不可见时停止请求动画帧。系统偏好减少动态效果时默认暂停；用户仍可主动播放。

这是轻微整体摇曳的教学样例。横向剪切会轻微拉伸笔触，不是保长度的物理模拟；所有叶片共用一个网格，不会分别摆动，也无法显示未画出的背面。更自然的独立叶片动作需要拆分素材或为每片叶子设置独立控制点。

## 文件

- [index.html](index.html)：对照画面与控制项，布局使用 Tailwind 工具类。
- [demo.js](demo.js)：纹理映射、网格变形、控制与生命周期。
- [preview.mjs](preview.mjs)：内存中编译 Tailwind，只提供白名单内的示例资源。
- [grass.png](grass.png)：原始生成结果，未做程序化抠图或图像修饰。

## 素材来源与生成提示词

本素材使用内置 ImageGen 生成，不是图库下载或现成模型。风格参考为本轮讨论中此前生成的 C 版草坪图（画笔质感与色块体积感）；那张整景仅作为参考，没有直接切割其中的草。生成原文件名：`exec-da607d02-996f-48ff-b351-2df0ed566855.png`。

完整提交的提示词：

> Create ONE isolated grass sprig as an animation-ready transparent PNG asset. Use the attached image ONLY as the style reference: painterly stylized botanical gouache, confident angular brush marks, sage and olive greens with deep teal painted shadows and a few warm light-green highlights, softly modeled volume, like a painted 3D-to-2D look but entirely raster artwork. NEW composition: one slender upright grass plant with a single compact joined root point at the bottom center, a central stalk and 5–7 long tapering blades growing upward and outward. Plant occupies about 65% of width and 78% of height, completely visible including every tip and the joined base, ample TRANSPARENT margin on every side. The plant should read clearly at small website footer size. Portrait or square canvas. It will be gently bent by a 2D texture mesh; keep a connected silhouette and avoid disconnected loose strokes. No flowers, no butterflies, no ground, no dirt, no pot, no scene, no cast shadow, no labels. Background must be genuine transparent alpha, not white, not gray, not a painted checkerboard. Preserve rich painterly texture within the plant.

生成结果带有草穗、叶片数比提示词多；这个样例保留实际原图用于验证微风变形，不将它视为最终草坪素材定稿。
