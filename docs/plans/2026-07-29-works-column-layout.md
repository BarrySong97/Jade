# 作品集改版:纵向滚动的两列条目 — 实现计划

- 日期:2026-07-29
- 关联 spec:无(设计经 Artifact 原型逐版微调后定稿)

## 方案概述

把 `/products` 从「左栏简介 + 右侧自动流动的瀑布流(hover 就地暂停 + 自定义滚动条)」改成
**左栏 sticky 简介 + 右侧两列条目、整页普通纵向滚动**。骨架(左固定 / 右两列)沿用原来的,
真正变的是**单个作品的 UI**:原来是「整图 + 左下角半透明黑徽标」,现在是

```
[线性图标] 项目名                     2026 · iOS      ← 头部一行
一句说明,重点词墨色、其余灰色                          ← 描述
[产品图]                                              ← 一个项目一张图
```

层级靠**颜色**(墨/灰)而非字号拉开——整页正文都是同一号字,这是原型定下的调子。

自动流动整套机制(无缝循环复制、hover 冻结 margin-top、负 animation-delay 续播、自定义滚动条)
一并删除:用户明确不要自动滚动,而这些代码全部只为它服务。

## 涉及文件 / 模块

- `src/components/showcase/works-data.ts` — Work 类型改为 `t/y/cat/icon/desc + 图片字段`(去掉 `label`);
  两条 FLOWM 合并为一条(一个项目一张图);INTRO 改为 `who/thesis/paras/links` 新文案
- `src/components/showcase/rich-text.tsx` — **新增**:把 `**重点**` 标记渲染成墨色 `<b>` 的小组件
- `src/components/showcase/work-card.tsx` — 重写为「头部行 + 描述 + BlogImage」,内含线性图标表
- `src/components/showcase/works-intro.tsx` — 重写为原型左栏(方块站标 / barry song / 两行主张 / 四段灰文 / 三个链接)
- `src/components/showcase/works.tsx` — 去掉全部状态与命令式动画代码,退化为纯布局(sticky aside + 两列)
- `src/styles/showcase.css` — 删 `works-flow-down/up` 两组 keyframes 与 class,加一个 `works-rise` 载入上浮;
  删除随左栏大标题一起废弃的 `--serif` 令牌与 Newsreader 字体
- `docs/modules/components/showcase.md` + `docs/decisions/0004-*` — 同步文档与决策

## 任务拆解

1. [ ] 数据层:Work 类型 / WORKS 六条 / INTRO 新文案
2. [ ] rich-text + work-card + works-intro + works 四个组件
3. [ ] showcase.css:删流动动画与 serif,加 works-rise
4. [ ] 同步 showcase.md、补 ADR 0004、登记索引
5. [ ] `pnpm build` + 浏览器实看(宽屏 / 1180 / 880 三档)+ `check-docs` + `pnpm check`

## 风险 / 注意

- `works.tsx` 删掉的是页面**唯一**的客户端状态,但 `client:load` 仍要保留:`BlogImage` 的
  blur-up 与 Motion 需要 hydration。
- `--serif` 只有 works-intro 用,删之前已 grep 确认;photos 页不依赖。
- 左栏 sticky 在 880px 以下要退回静态(原断点保持 880,避免与摄影页认知不一致)。
- 图片高度差异大(grove 是 9:16 长图),两列高度会明显不齐——这是设计想要的,不要强行等高。

## 验证方式

`pnpm build` 通过;浏览器看 `/products`:整页纵向滚动、左栏跟随、两列错落、无自动流动;
窄屏两档断点正确;`node scripts/check-docs.mjs` 与 `pnpm check` 均 0 错。
