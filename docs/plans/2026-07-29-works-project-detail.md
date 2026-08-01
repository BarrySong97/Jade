# 作品集项目详情 + 转场 — 实现计划

- 日期:2026-07-29
- 关联:Cursor plan `works_detail_transition`

## 方案概述

`/products` 增加真路由详情 `/products/<slug>`。点击整条作品进入详情：左栏换成项目 Header，右栏展示该项目全部图片。封面图共享元素 morph 到右栏左上角；左栏用 clip-path 扫过切换文案。

## 任务拆解

1. [x] Work 加 slug + images[]，现有单图迁入数组
2. [x] 新增 /products/[slug] + WorkDetail 左右栏布局
3. [x] 列表整卡可点，封面打 data-work-cover
4. [x] 封面 morph + 左栏 clip-path 扫过转场与降级
5. [x] 同步 showcase 文档，build + 浏览器验证
