# 独立交互示例

`examples/` 保存设计讨论中的独立验证页面，不作为 Astro 路由发布。选定草甸的 11 张原画已被首页构建引用；自然排布与 WebGL 渲染器提取到 `src/`，预览调用同一份源码。

## 首页头像三渲二对照

[头像预览](../../../examples/portrait/README.md) 是新的独立页面，运行 `pnpm demo:portrait`，打开 <http://localhost:55024>。以首页实际使用的 `src/assets/info/profile-portrait.png` 为身份与姿态参考，生成一张透明彩色手绘头像；完整提示词和内置 ImageGen 来源记录在示例目录。

- [页面](../../../examples/portrait/index.html) 展示大图对照及首页实际图片宽度（桌面 212px / 手机 190px），原始画布完整显示，点击大图可查看 PNG。
- [底色控件](../../../examples/portrait/preview.js) 提供浅色/深色观察，并同步 `aria-pressed`；不修改博客主题。
- [本地服务](../../../examples/portrait/preview.mjs) 只监听 loopback，Tailwind 在启动时编译，白名单直接读取原头像与新 PNG。未修改首页组件、原头像或生产路由。
- 验收：实看人物特征与缩小后的辨识度；确认图片解码、透明背景、两种底色切换、键盘可操作、窄屏无水平溢出。生成的肤色来自对黑白原稿的推定，并非照片取色。

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
- 预览控件和历史方案留在独立目录；选定自然草甸已通过 [首页组件](../../../src/components/home/home-meadow.astro) 放到首页 Footer 后。用户最终选择首页加入杏黄与蓝紫两只蝴蝶，猫与完整追逐保留在独立 demo。

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

[cat/README.md](../../../examples/meadow/cat/README.md) 保存按用户猫照片生成的透明坐姿原画、身体/尾巴分层初稿、跑跳姿势图集和完整提示词。它匹配花草的手绘明暗色块，已用于尾尖网格摆动和独立跑跳实验；当前尚未接入首页。原始私人照片不复制进仓库。

小猫卡片直接放在原花草 demo 的素材区，与三张花草姿态素材并排；入口 <http://localhost:55022/#cat-sample>，点击可打开原图。分层素材与静态叠合对照在同页 <http://localhost:55022/#cat-layers>，使用两个同尺寸同坐标的 PNG，不按各自可见边界居中。预览服务仅允许九个猫 PNG 与七个动画模块的固定路径，不开放整个猫目录。

独立动画板 <http://localhost:55022/#cat-board> 由 [cat-board.js](../../../examples/meadow/cat/cat-board.js) 管理，使用 [cat-renderer.js](../../../examples/meadow/cat/cat-renderer.js) 绘制身体和 19 × 9 顶点尾巴网格；[tail-motion.mjs](../../../examples/meadow/cat/tail-motion.mjs) 固定连接区域，使尾尖渐进轻摆并带休息段。猫与花草各有 Canvas、控件和生命周期；屏外、后台暂停帧，尾巴实验零幅度停表，减少动态效果时默认静止，失败显示静态叠图。

跑跳由 [cat-motion.mjs](../../../examples/meadow/cat/cat-motion.mjs) 编排，配合 [cat-atlas.mjs](../../../examples/meadow/cat/cat-atlas.mjs) 注册的两个 4×2 图集。跑步逐姿势改变四肢，跳跃包括蓄力、蹬地、腾空、落地缓冲；自动演示间隔休息，按钮支持单次触发和慢放。图集经 ImageGen 补留白以避免串帧，同组统一比例，原始 PNG 不改像素。架构边界见 [ADR-0007](../../decisions/0007-cat-demo-actions.md)。

`pnpm test:meadow` 包含尾巴边界以及跑跳落点、阶段、循环、alpha 和视口裁切回归；图集原画入口在动画板下的折叠区。坐站等过渡已经补齐，生成帧的细节一致性与动态接缝需实际看页面；用户选择自行查看，本轮未重新接管浏览器，不能将纯函数/HTTP 检查视为实屏验收。

动画板默认显示关节辅助线，可关闭或切换“只看骨架”，也可拖动进度暂停观察当前姿势。[cat-skeleton.mjs](../../../examples/meadow/cat/cat-skeleton.mjs) 人工标注 16 个跑跳姿势和坐姿，并合并 [cat-transition-skeletons.mjs](../../../examples/meadow/cat/cat-transition-skeletons.mjs) 的 32 个过渡姿势，按躯干、前腿、后腿、尾巴配色，遮挡侧腿使用虚线。它是说明性标注，不能表述为驱动图集的真实骨骼或蒙皮；尾巴标记调用实际网格的变形函数。图集与辅助线共用 `cat-atlas.mjs` 的坐标变换，保证镜像、离地与响应式缩放一致；回归同时验证可见标记落在真实 PNG 主体内。

坐站、起跑收步、跳跃准备恢复、转身四组图集补足状态衔接，原 PNG 和提示词见 [过渡说明](../../../examples/meadow/cat/README.md)。`cat-motion.mjs` 用已有姿势作为过渡端点，只在坐稳/站稳接受新动作；`cat-board.js` 排队最新请求，飞行必须先落地，跑动完成当前跑段再收步。动作继承位置、朝向、观察距离与尾巴幅度；尾巴相位单独累计。坐姿图层和标注也按当前朝向镜像，尾巴观察距离平滑改变。自动演示回场前缀只执行一次。协议与回归见 [ADR-0008](../../decisions/0008-cat-action-transitions.md)。

## 蝴蝶独立预览

[butterfly/README.md](../../../examples/meadow/butterfly/README.md) 保存暖杏黄色蝴蝶的八姿势透明图集、来源及完整提示词。由内置 ImageGen 参考已有花草笔触生成并修正留白，PNG 原样保存。入口仍在原页 <http://localhost:55022/#butterfly-board>。

- [butterfly-motion.mjs](../../../examples/meadow/butterfly/butterfly-motion.mjs) 定义帧注册点、统一比例、八姿势循环、连续飞行路线与原地观察过渡。切换可中途反向且不重置振翅相位；手机限制活动范围。
- [butterfly-board.js](../../../examples/meadow/butterfly/butterfly-board.js) 在独立 Canvas 2D 中采样当前 PNG 姿势，提供暂停、慢放、原地放大及轨迹开关。屏外/后台停表，减少动态效果默认暂停，页面退出清理监听与观察器；失败保留静态原画。不会调用猫或花草的状态。
- 预览服务只新增一张 PNG 和两个模块的明确路径；页面折叠区提供八姿势原画，PNG 和两个模块均不进入首页构建，没有新增运行依赖。
- `pnpm test:meadow` 检查周期、注册点、观察切换连续性与真实 alpha/间隔/窄屏边界；实际振翅观感和控件需浏览器验收，延续用户自行打开原页的选择。

## 草丛追蝶完整场景

原页 <http://localhost:55022/#chase-scene> 合成猫、蝶和自然草甸，[chase/README.md](../../../examples/meadow/chase/README.md) 保存原画/提示词、模块职责和验收边界。新增伏低探头、跑扑过渡、落花起飞三个透明图集；复用现有跑跳与振翅。

`chase-layout.mjs` 调整已有两朵花、四株藏身草与三株沿路低草，株数不变；花心原图坐标经过裁切、镜像和 9 行网格投影成为停驻点。猫地面埋在底边草根内，前草不跟猫下移；`chase-assets.mjs` 按真实脚底校准跑步接触帧，保留腾空帧。`chase-motion.mjs` 共用时钟编排探头、落花、1–2 秒伏低等待、连续跑扑、逃离、落地、回另一侧草丛与转身。蝴蝶由猫进入花头接近区触发起飞，六轮交替方向/花朵/时长，循环不传送猫。

`chase-renderer.js` 在一个 WebGL 画布按后景→地面软阴影→猫→前草→蝴蝶绘制，动物仍是姿势图集。影子固定在地面，腾空时变淡；Canvas 回退共用参数。`chase-board.js` 管理暂停、慢放、当前轮进度、屏外/后台停表、减少动态效果、响应式保留阶段，以及上下文丢失/恢复与静态 Canvas 回退。入口脚本与三张新 PNG 都由预览白名单提供，不成为 Astro 路由。旧画板保留独立控制。

协议见 [ADR-0009](../../decisions/0009-meadow-chase.md)，[chase.test.mjs](../../../scripts/chase.test.mjs) 强制真实 alpha/间隔、落花贴合、因果顺序、位置/跑扑速度、窄屏裁切与前草部分遮挡。HTTP 和纯函数检查不能代替真实浏览器；延续用户自行查看原页的选择。

## 首页选用的双蝴蝶

用户决定猫只留 demo，首页使用杏黄与新蓝紫蝴蝶。两张蓝紫透明原画和提示词见 [蝴蝶说明](../../../examples/meadow/butterfly/README.md)。生产只引用四张蝴蝶 PNG，动画纯逻辑位于 `src/lib/`，不依赖这里的猫或追逐模块。共享植物渲染器增加可选图集绘制，预览白名单补充 `src/lib/meadow-wind.mjs`，旧画板继续运行。
