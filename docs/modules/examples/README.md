# 独立交互示例

`examples/` 保存设计讨论中的独立验证页面，不作为 Astro 路由发布。选定草甸的 11 张原画已被首页构建引用；自然排布与 WebGL 渲染器提取到 `src/`，预览调用同一份源码。

## PNG 草叶动画

[示例目录](../../../examples/png-grass/README.md) 用同一张透明 PNG 对照静态图片与二维网格变形。入口命令为 `pnpm demo:grass`，预览地址为 <http://localhost:55021>。

- [页面](../../../examples/png-grass/index.html) 提供暂停、网格显示和风力控制。
- [渲染器](../../../examples/png-grass/demo.js) 使用原生 WebGL 渲染 27 个顶点组成的 32 个三角形；Canvas 2D 绘制原图与解释性叠加。纹理不变，每帧更新顶点位置，根部固定。
- [本地服务](../../../examples/png-grass/preview.mjs) 使用已有 Tailwind 编译页面工具类，仅监听 loopback，并限定可访问的资源路径。
- 素材来自本轮 ImageGen 生成；完整提示词、处理边界与限制记录在示例 README。

浏览器验收：确认 PNG 加载且具有透明背景；左右笔触一致；动画持续变化；暂停后停止；风力为 0 时回到原形；开启网格后根部保持固定；检查窄屏无水平溢出及减少动态效果时默认暂停。它展示的是整株轻微变形，不能据此判断独立叶片、蝴蝶振翅或整片草坪的最终效果。

## 完整花草组合

[花草预览](../../../examples/meadow/README.md) 是用户确认二维网格路线后的完整素材组合。运行 `pnpm demo:meadow`，打开 <http://localhost:55022>。

- [五张独立 PNG](../../../examples/meadow/README.md) 分别为低草、高草、白雏菊、淡紫花和黄色野花；原画由内置 ImageGen 生成，保留透明通道，提示词可追溯。
- [场景排布](../../../examples/meadow/meadow.js) 使用多层植物遮挡和不同高度、间距组成连续底边；[共享渲染器](../../../examples/meadow/renderer.js) 为每株设置不同摆动相位与幅度，根部固定。
- 页面提供整景风动、暂停、风力与代表植物网格，以及每张素材的原图入口。窄屏调整排布；后台、屏外、零风力时停止动画帧，减少动态效果时默认暂停。
- 预览控件和历史方案留在独立目录；选定自然草甸已通过 [首页组件](../../../src/components/home/home-meadow.astro) 放到首页 Footer 后。蝴蝶另行制作。

## 更多花型与混种场景比较

上述预览地址默认展示 [variations.html](../../../examples/meadow/variations.html)：自然群落草甸与三种混种组合（7 种、11 种与 6 种花），上一版草甸和原来的五种组合收在可展开对照区，每个场景可切换到可动大图。素材包括最早的五张、八种花型和本轮补充的两种草叶/一种白花姿态，共十六张透明 PNG；来源和提示词见 [素材说明](../../../examples/meadow/README.md)。

- [scene-data.mjs](../../../examples/meadow/scene-data.mjs) 集中花型名称、场景参数和确定性排布，供预览服务白名单、主图和缩略图共享。
- [variations.js](../../../examples/meadow/variations.js) 提供场景切换、当前花型列表、缩略图与原图卡片；切换不重建 WebGL 上下文，也不重置暂停和风力。
- 缩略图用同一份场景的原始素材绘制，避免概念图与实际组合不一致；新增花都至少用于一个场景。原单场景页面保留在 `/original`。
- 混种场景把高花与低处点缀分层穿插，变化落点、高度和间距；较矮花株在前，复用原画与网格风动。旧场景链接可展开对照区，折叠区展开时重绘缩略图。
- 默认入口为 `#wild-meadow`：[natural-meadow.mjs](../../../examples/meadow/natural-meadow.mjs) 以不规则群落、同类花局部聚集和连续草叶密度场打破等距分段；总株数取上一版同视口的 90%，固定种子保证排布稳定。旧版为 `#wild-meadow-v1`，用于实看密度与重复感变化。
- 新增疏叶细草、弧叶草丛和侧向白花，以独立 PNG 补足轮廓与姿态变化；无穗草按叶片尺度与旧草匹配，避免视觉体积变大。
- `natural-meadow.mjs` 与 `renderer.js` 是共享源码的兼容导出；预览服务明确允许两个共享文件的路径，不开放整个 `src/`。共享真源分别是 [meadow-layout.mjs](../../../src/lib/meadow-layout.mjs) 与 [meadow-renderer.js](../../../src/components/home/meadow-renderer.js)。

## 草甸小猫造型

[cat/README.md](../../../examples/meadow/cat/README.md) 保存按用户猫照片生成的透明坐姿初稿和完整提示词。它匹配花草的手绘明暗色块，作为自然小猫动画的造型参考；当前只有单张原画，尚未拆部件、制作动作帧或接入首页。原始私人照片不复制进仓库。
