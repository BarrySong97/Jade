# 首页头像 · 三渲二预览

```bash
pnpm demo:portrait
```

打开 <http://localhost:55024>。独立页面展示原头像与黑白三渲二生成稿大图、首页图片宽度（桌面 212px / 手机 190px）、浅深底色和 PNG 原图入口。用户已确认黑白第二版并用于首页；此预览页面与脚本不进入 Astro 构建。

## 素材

- 原头像直接读取 [profile-portrait.png](../../src/assets/info/profile-portrait.png)，1330 × 1182，透明 PNG；身份、眼镜、发型、朝向和衣服的唯一参考。
- 当前版本：[portrait-monochrome-v2.png](portrait-monochrome-v2.png)，1341 × 1173，透明 PNG；按用户要求以黑白灰阶保留三渲二笔触和明暗，页面及下载入口都使用这张图片。2026-09-19 由内置 `image_gen` 参考第一版进行颜色修改，完整提示词见 [prompt-monochrome-v2.json](prompt-monochrome-v2.json)。输出原样复制，没有抠图、裁切、滤镜或重新编码。
- 首页 [profile-intro.astro](../../src/components/home/profile-intro.astro) 直接引用同一张黑白 PNG，由 Astro Image 构建为 424px WebP；保留原来的显示宽度、位置和排版。
- 历史彩色稿：[portrait-painted-v1.png](portrait-painted-v1.png)，1341 × 1173，透明 PNG；2026-09-19 使用内置 `image_gen` 生成。仅留作来源记录，不在页面展示。
- [小猫原画](../meadow/cat/cat-idle-v1.png) 仅作为手绘笔触和块面明暗的风格参考，不作为人物外形参考。
- 第一版提示词、参考角色及生成来源见 [prompt-v1.json](prompt-v1.json)。源图为黑白，初稿肤色是生成推定；用户选择保持黑白后改为第二版。

## 实现

`preview.mjs` 使用项目已有 Tailwind 编译工具类，仅绑定 `127.0.0.1:55024`，只提供页面、控件、CSS、两张 PNG 的固定路径。修改 HTML 工具类后重启服务。页面不依赖博客服务或外部 CDN。

`preview.js` 仅切换预览底色与按钮选中状态，不修改图片、不保存博客主题。原图和新图始终保留各自完整画布及宽高比；放大区使用同尺寸容器，缩小区使用首页真实 CSS 宽度。

验证（2026-09-19）：PNG 解码与真实 alpha 通过；ego-browser 实看桌面/375px 窄屏截图，图片全部加载，图片宽度分别为 212px/190px，窄屏文档宽度为 375px、无水平溢出；底色按钮和 Enter 键切换通过。`pnpm build`（50 页）、`pnpm check`（39 项测试、0 lint 错误，6 个原有未使用变量警告）、`node scripts/check-docs.mjs` 均通过。

黑白修订验证：实看浏览器截图，大小预览及下载均指向第二版，四个图片元素全部解码成功；新图保留透明通道。构建、39 项回归与文档检查再次通过。
