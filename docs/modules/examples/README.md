# 独立交互示例

`examples/` 保存设计讨论中的最小验证，不接入 Astro 路由、站点布局或生产构建。

## PNG 草叶动画

[示例目录](../../../examples/png-grass/README.md) 用同一张透明 PNG 对照静态图片与二维网格变形。入口命令为 `pnpm demo:grass`，预览地址为 <http://localhost:55021>。

- [页面](../../../examples/png-grass/index.html) 提供暂停、网格显示和风力控制。
- [渲染器](../../../examples/png-grass/demo.js) 使用原生 WebGL 渲染 27 个顶点组成的 32 个三角形；Canvas 2D 绘制原图与解释性叠加。纹理不变，每帧更新顶点位置，根部固定。
- [本地服务](../../../examples/png-grass/preview.mjs) 使用已有 Tailwind 编译页面工具类，仅监听 loopback，并限定可访问的资源路径。
- 素材来自本轮 ImageGen 生成；完整提示词、处理边界与限制记录在示例 README。

浏览器验收：确认 PNG 加载且具有透明背景；左右笔触一致；动画持续变化；暂停后停止；风力为 0 时回到原形；开启网格后根部保持固定；检查窄屏无水平溢出及减少动态效果时默认暂停。它展示的是整株轻微变形，不能据此判断独立叶片、蝴蝶振翅或整片草坪的最终效果。
