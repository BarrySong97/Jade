# lib 模块

## 职责

无 UI 的工具、配置与领域逻辑。**边界**:纯函数 / 常量 / hook,不渲染界面;界面在 `src/components/`。

## 文件清单与关系

- `utils.ts` — `cn()`:合并并去重 Tailwind class(clsx + tailwind-merge)。几乎所有组件都用。
- `site.ts` — `PROFILE` 常量:站点作者身份(姓名、handle、简介、社交链接)。首页与展示页引用。
- `use-copy-button.ts` — React Hook:复制按钮「已复制」态,1.5s 自动复位。代码块复制用。
- `cloud-image-config.ts` — 云图片 CDN 域名常量 + 「Key → 完整 URL」拼接。
- `cloud-image-utils.ts` — 云图片 Key 解析:拆文件名元信息、推导对应 BlurHash 占位图 Key。
- 调用关系:`cloud-image-*` 被 `components/common/cloud-image.tsx` 消费,组成「云图片」专题(跨 lib/components)。

## 对外接口

- 全部经 `@/lib/...` 别名引入(如 `@/lib/utils` 的 `cn`)。

## 注意事项

- 文件级细节看各文件**文件头**。
- 云图片的完整规格(命名约定、上传变体、BlurHash 流程)见专题:[docs/cloud-image-component.md](../../cloud-image-component.md) · [docs/cloud-image-upload-spec.md](../../cloud-image-upload-spec.md)。
