# 维护脚本模块

## 职责与边界

`scripts/` 保存构建辅助、内容处理与 Agent 质量检查工具；它们在本地命令行执行，不进入网站客户端。本文记录文档检查器、Stop hook 接口与草甸回归测试。

## 文档检查器

- [check-docs.mjs](../../../scripts/check-docs.mjs) 检查 AI 文件头、文档链接和模块文档漂移；规则来自 [check-docs.config.json](../../../check-docs.config.json)。
- 普通 CLI 输出可读报告，通过退出 `0`，失败退出 `1`；`--strict` 将漂移警告升级为失败。
- `--hook` 由 [.codex/hooks.json](../../../.codex/hooks.json) 和 [.claude/settings.json](../../../.claude/settings.json) 的 Stop 事件调用。

## Stop 输出协议

| 检查结果                   | stdout                              | stderr         | 退出码 |
| -------------------------- | ----------------------------------- | -------------- | ------ |
| 通过                       | 单个 JSON 对象 `{}`                 | 无报告         | `0`    |
| 仅非阻断警告               | JSON 对象，`systemMessage` 包含报告 | 无报告         | `0`    |
| 硬错误，或严格模式下的警告 | 空                                  | 报告与修复说明 | `2`    |

成功的 Stop stdout 不可包含标题、emoji 或其他普通日志。曾直接复用 CLI 报告导致每次收尾都出现 `hook returned invalid stop hook JSON output`。协议依据：[OpenAI Hooks 文档](https://developers.openai.com/zh-Hans/docs/hooks#stop)。检查规则与拦截条件不因输出格式调整而放宽。

## 回归验证

海港页脚版额外约束 240–1920px 通栏宽度、零侧边距、底边锚定和小船 66px 上限，避免退回居中的大插画。

[harbor.test.mjs](../../../scripts/harbor.test.mjs) 通过 `pnpm test:harbor` 检查独立海港 Demo 的远航/渐隐重置、宽窄屏坐标边界、振翅滑翔、真实 PNG/WebP 透明通道、八帧安全留白与肩部注册点，并约束尚未进入 About。第二版增加放大船体、船坞边界及三位工人固定脚底和四姿势覆盖。已接入 `pnpm check`；视觉观感仍须浏览器验收。

[check-docs.test.mjs](../../../scripts/check-docs.test.mjs) 使用临时文件和实际 Node 子进程验证输出、JSON 可解析性与退出码；通过 `pnpm test:hooks` 执行，已接入 `pnpm check`。更多流程见 [测试策略](../../testing.md) 和 [运行手册](../../run.md)。

[meadow.test.mjs](../../../scripts/meadow.test.mjs) 通过 `pnpm test:meadow` 验证迁入首页后的共享排布与已确认预览相同、90% 株数和固定种子稳定，并检查只有首页接入草甸、通用布局只提供 Footer 后插槽；执行 [ADR-0006](../../decisions/0006-home-meadow.md) 的页面边界。它也接入 `pnpm check`。

同一命令还执行 [cat-tail.test.mjs](../../../scripts/cat-tail.test.mjs)：验证独立猫画布的尾巴连接区固定、零幅度保持原形、休息段与周期连续、位移有界且网格列不翻折。实际纹理与控件仍通过页面验收。

[cat-actions.test.mjs](../../../scripts/cat-actions.test.mjs) 同样接入 `pnpm test:meadow`，验证跑跳阶段、完整跑姿、返回方向、休息占比、单次落点与循环连续；解码真实图集 alpha，检查透明留白和主体在桌面/窄屏不越界。首轮生成图集姿势挨得过近，修正后将间隔检查固化为测试，避免后续替换图片时串帧。

同一回归还检查辅助关节标注：镜像、离地与原画共用的坐标变换，坐姿尾巴标记跟随实际网格，以及标注源数据不可被动作修改。部分初次手工标记落在透明边缘，校准后把“可见标记须位于图集主体”纳入真实 alpha 检查；虚线的遮挡侧位置明确为估计，不用来声称骨骼驱动图片。

状态过渡回归执行 [ADR-0008](../../decisions/0008-cat-action-transitions.md)：任意时间发起的动作必须等到坐稳/站稳，继承原姿势、位置、朝向、观察距离和尾巴幅度；空中切换必须完成落地恢复。另检查坐站/起跑收步顺序、移动速度连续、尾巴与观察距离边界、自动回场前缀只执行一次，并将四张过渡图集纳入透明留白和标注检查。

[butterfly.test.mjs](../../../scripts/butterfly.test.mjs) 同样加入 `pnpm test:meadow`，验证八姿势循环、观察方式不改相位、飞行首尾位置和方向连续、原地注册点不动、放大过渡可中途反向；真实 PNG 解码检查透明留白、身体注册点、开合轮廓差和 240/335/375/1327px 画布范围。生成首版翼尖靠近边界，修正后将留白检查固化，避免替换素材串帧。

[chase.test.mjs](../../../scripts/chase.test.mjs) 执行 [ADR-0009](../../decisions/0009-meadow-chase.md)：解码真实花草与动物 PNG，验证落花后 1–2 秒伏低等待、跑步直接接扑跳、猫接近才逃离、接触点随网格风动、阶段/循环位置连续、缩放保留剧情与 240–1327px 真实轮廓边界。另用前草与猫的 alpha 交叠采样验证部分遮挡，避免只检查绘制层级却完全没有藏身效果。仍不能代替实际画面的节奏和图集接缝验收。

用户反馈猫悬在草叶上后，补充真实落脚帧贴合草根地面、跑姿接触帧不悬空、接触阴影留在地面且腾空变淡的回归。边界检查允许少量脚底埋到下边界，仍限制头身和蝴蝶完整可见；“所有像素都在画布内”不再用作贴地的替代指标。

[home-butterflies.test.mjs](../../../scripts/home-butterflies.test.mjs) 执行 [ADR-0010](../../decisions/0010-home-butterflies.md)：真实原图必须呈现杏黄/蓝紫两色并有透明间隔，两只拥有不同周期与不重叠的候选花株；停驻、共享网格插值、周期衔接和 240–1920px 真实翅膀范围可采样验证。递归检查首页客户端依赖不包含猫/demo 代码，组件保留两色静态回退标记。
