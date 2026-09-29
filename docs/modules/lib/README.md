# lib 模块

## 职责

无 UI 的工具、配置与领域逻辑。**边界**:纯函数 / 常量 / hook,不渲染界面;界面在 `src/components/`。

## 文件清单与关系

- `utils.ts` — `cn()`:合并并去重 Tailwind class(clsx + tailwind-merge)。几乎所有组件都用。
- `site.ts` — `PROFILE` 常量:站点作者身份(姓名、handle、简介、社交链接);另导出 `TWITTER` / `TWITTER_HANDLE`(从 social 派生),供展示页(作品/摄影)联系方式复用,与首页一致。首页与展示页引用。
- `use-copy-button.ts` — React Hook:复制按钮「已复制」态,1.5s 自动复位。代码块复制用。
- `meadow-wind.mjs` — 共享 9 行植物网格的风动幅度与内部接触点插值；渲染与首页蝴蝶停驻使用同一投影，根部不动。
- `butterfly-atlas.mjs` — 四张杏黄/蓝紫振翅与停驻图集的原图采样区和足部注册点。压缩后仍按原始 1774×887 坐标归一化；`butterflySprite()` 输出共享渲染器需要的矩形、UV 和旋转中心。
- `meadow-butterflies.mjs` — 首页两只蝴蝶的飞行、收翅落花、停驻与起飞，29/37 秒周期和不同候选花株，使用全局飞行时间保证循环连续。独立于猫/demo，回归和边界见 [ADR-0010](../../decisions/0010-home-butterflies.md)。
- `meadow-layout.mjs` — 首页与设计预览共享的纯草甸排布：`MEADOW_ASSET_IDS` 限定 11 张原画，`meadowReferencePopulation()` 保留旧预览计数边界，`arrangeNaturalMeadow()` 用固定种子生成不规则花簇与草叶分层，株数为旧版的 90%。构建期静态图与客户端 WebGL 都调用它；非正画布尺寸返回空集合，`pnpm test:meadow` 验证与已确认预览一致。
- `cloud-image-config.ts` — 云图片 CDN 域名常量 + 「Key → 完整 URL」拼接。
- `cloud-image-utils.ts` — 云图片 Key 解析:拆文件名元信息、推导对应 BlurHash 占位图 Key。
- `thumbhash-placeholder.ts` — thumbhash(base64)→ `{ 平均色, 模糊图 dataURL }`,给 `.astro` 组件在构建期算好内联(React 侧的 `blog-image.tsx` 自己在 `useMemo` 里做同样的事)。
- 调用关系:`cloud-image-*` 被 `components/common/cloud-image.tsx` 消费,组成「云图片」专题(跨 lib/components);`thumbhash-placeholder.ts` 被引用卡片消费,见「引用卡片」专题。

## 对外接口

- 全部经 `@/lib/...` 别名引入(如 `@/lib/utils` 的 `cn`)。
- 首页「找到我」按 `PROFILE.social` 顺序展示 Twitter、小红书，链接在新标签页打开；展示页仍通过 `TWITTER` 仅引用 Twitter。

## 注意事项

- 文件级细节看各文件**文件头**。
- 云图片的完整规格(命名约定、上传变体、BlurHash 流程)见专题:[docs/cloud-image-component.md](../../cloud-image-component.md) · [docs/cloud-image-upload-spec.md](../../cloud-image-upload-spec.md)。
- 引用卡片(含外链元数据缓存 `src/data/link-cards.json`)见专题:[docs/topics/link-cards.md](../../topics/link-cards.md)。
