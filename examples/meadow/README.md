# 花与草 · 完整组合预览

运行 `pnpm demo:meadow`，打开 <http://localhost:55022>。预览服务只监听本机，`Ctrl+C` 停止。需要已安装项目依赖，无新增依赖。

默认入口现为五种场景对比：A 林间白蓝、B 粉色野花、C 紫色花境、D 春日花园、E 原版花草。点击卡片切换可动大图，页面下方查看每张独立素材；链接末尾可用 `#woodland`、`#blush`、`#violet`、`#garden`、`#original` 直接打开对应场景。第一版单场景页面保留在 <http://localhost:55022/original>。

## 新增八种花型

用户看过花型讨论后要求全部生成并组合比较，本次新增：

| 素材                                  | 主要使用场景                 |
| ------------------------------------- | ---------------------------- |
| [铃兰](assets/flower-lily.png)        | 林间白蓝                     |
| [风铃草](assets/flower-bell.png)      | 林间白蓝、紫色花境           |
| [勿忘草](assets/flower-forget.png)    | 林间白蓝、紫色花境、春日花园 |
| [波斯菊](assets/flower-cosmos.png)    | 粉色野花、春日花园           |
| [耧斗菜](assets/flower-columbine.png) | 紫色花境                     |
| [鸢尾](assets/flower-iris.png)        | 紫色花境                     |
| [虞美人](assets/flower-poppy.png)     | 粉色野花                     |
| [郁金香](assets/flower-tulip.png)     | 春日花园                     |

八张新增素材使用内置 ImageGen，沿用原 C 版概念作为风格参考，原始生成结果直接保存。完整提示词与生成文件对应见 [prompts-variations.json](prompts-variations.json)。它们是风格化植物插画，不是植物鉴定图谱。

[scene-data.mjs](scene-data.mjs) 统一素材目录、场景配置与排布；[variations.js](variations.js) 控制场景切换、原图卡片和缩略图；[variations.html](variations.html) 为默认比较页。缩略图使用同一素材与同一排布函数，由 Canvas 2D 在静止状态绘制；大图使用同一个 WebGL 上下文进行风动，不为每张卡片创建独立 WebGL 纹理副本。切换场景保留风力与暂停状态。

## 第一版素材

用户在单株 PNG 网格动画之后要求生成完整花草，本轮提供五张独立透明素材与可动的连续花草带。风格来自此前选定的 C 版概念：手绘色块、可见笔触、鼠尾草绿和橄榄绿、奶油白与少量淡紫和黄色。

| 素材                                 | 用途                       |
| ------------------------------------ | -------------------------- |
| [低矮草丛](assets/grass-low.png)     | 较宽的叶片簇，连接草坪底部 |
| [细叶高草](assets/grass-tall.png)    | 长叶与草穗，形成高低变化   |
| [白色雏菊](assets/flower-daisy.png)  | 白色主花、侧花与花苞       |
| [淡紫小花](assets/flower-violet.png) | 细茎上的淡紫花序           |
| [黄色野花](assets/flower-yellow.png) | 小面积的暖黄点缀           |

所有 PNG 均由内置 ImageGen 生成并原样复制到本目录，保留真实 alpha。完整提示词和生成文件来源保存在 [prompts.json](prompts.json)。未将概念整景直接切割，也未用程序重画或抠图。页面底部可分别打开每张原图。

## 组合与动作

- [meadow.js](meadow.js) 按后层高草、低草、花株、前层小草绘制。高度、间距与镜像不同，使用确定性排布；手机上调整尺寸和数量。
- [renderer.js](renderer.js) 在同一个 WebGL canvas 上绘制所有植物，每种加载的素材只上传一次纹理，共享一个 3 × 9 顶点网格。每株拥有自己的摆动相位和幅度，花比草摆得轻。
- 每株保持底部整行不动，上方按 `bend × h²` 横向位移。原图不变，纹理坐标不变，GPU 将原图采样到变形的三角形上。
- 预览支持暂停、风力、网格显示。网格只标注部分代表植物，以便看清单株结构。风力为零、页面不可见或草坪离开视口时停止动画帧；偏好减少动态效果时默认静止。
- 画布底部遮住植物收束的根尖，前后层低草连接成连续边缘。该画布是固定视角的二维组合。

本轮重点是素材和完整花草视觉；它仍是独立预览，没有接入 Astro 生产页面。蝴蝶为后续步骤，当前花草整株摆动，未拆独立花瓣和每片叶子。大幅度风动会拉伸原画，因此默认微风。

## 文件与验证

[index.html](index.html) 使用 Tailwind 工具类完成布局；[preview.mjs](preview.mjs) 在内存中编译样式，只允许明确列出的资源路径。

验收项目：十三张原图解码与真实 alpha、五种场景切换与原图入口、全部新花至少在一景中出现、缩略图与大图使用相同素材、微风连续变化、暂停后时间固定、零风力回到原形、网格开关、手机无水平溢出、减少动态效果时静止。仓库验证沿用 `pnpm build`、`pnpm check` 和 `node scripts/check-docs.mjs`。
