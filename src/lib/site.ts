/**
 * @purpose 定义站点作者身份信息（PROFILE 常量：姓名、简介、社交链接等）
 * @role    单一数据源，被首页/关于/页脚等展示个人信息的组件统一 import
 * @deps    无外部依赖，纯常量
 * @gotcha  as const 只读对象，修改身份信息只在此处改；详见 docs/modules/lib/README.md
 */

// 站点身份信息 — 墨白克制风格统一引用
export const PROFILE = {
  name: "Barry Song",
  handle: "barrysong",
  title: "什么都会点软件工程师",
  location: "贵阳",
  bio: "什么都会做一点的工程师。日常健身、写代码和设计、学习语言。",
  social: [
    { label: "GitHub", url: "https://github.com/BarrySong97" },
    { label: "Twitter", url: "https://x.com/BarrySong97" },
  ],
} as const;

/* Twitter 链接 + 句柄(展示页联系方式复用,保持与首页一致) */
export const TWITTER = PROFILE.social.find((s) => s.label === "Twitter")!;
export const TWITTER_HANDLE = `@${TWITTER.url.replace(/\/+$/, "").split("/").pop()}`;
