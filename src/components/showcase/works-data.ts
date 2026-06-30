/**
 * @purpose 作品集页的静态数据与类型：Theme/Work/Contact 类型、INTRO 简介、WORKS 列表、PALETTES 占位调色板及 placeholderBg 取色函数
 * @role    被 works.tsx / works-intro / work-card 引用的数据与类型单一来源
 * @deps    @/lib/site(TWITTER/TWITTER_HANDLE,联系方式复用首页社交链接)
 * @gotcha  Work.p 是调色板索引、ar 是宽高比；PALETTES 每主题各 6 色，placeholderBg 按 idx 取模循环，接真实图后这些占位可删。CONTACT 只展示 Twitter,链接取自 PROFILE(与首页一致)
 */

import { TWITTER, TWITTER_HANDLE } from "@/lib/site";

/* 作品集数据 */
export type Theme = "dark" | "light" | "paper";

export interface Work {
  t: string; // 标题
  y: string; // 年份
  cat: string; // 分类
  ar: number; // 宽高比
  p: number; // 调色板序号（占位用）
  img?: string; // 真实图路径（public/ 下，设置后渲染 <img> 取代占位色块）
  label?: string; // 有图时右上角黑底白字应用标识的应用名（类 Twitter 卡片域名标）
  desc?: string; // 标识里应用名下方的一句说明
}

export interface Contact {
  label: string;
  value: string;
  url: string;
}

export const INTRO = {
  name: "Selected Works",
  zh: "作品选辑",
  years: "2019 — 2026",
  para: "这里收录我这些年做过的部分项目——品牌、界面、字体与一些自发的实验。它们大小不一、媒介各异，但都关于同一件事：把复杂的东西，安静地讲清楚。",
  contact: [{ label: "Twitter", value: TWITTER_HANDLE, url: TWITTER.url }] as Contact[],
};

export const WORKS: Work[] = [
  {
    t: "FLOWM",
    y: "2026",
    cat: "Product",
    ar: 1.9,
    p: 1,
    img: "/works/flowm.png",
    label: "FLOWM",
    desc: "非对账记账软件",
  },
  {
    t: "Immersed",
    y: "2026",
    cat: "Product",
    ar: 1.9,
    p: 0,
    img: "/works/immersed.png",
    label: "Immersed",
    desc: "AI 辅助阅读英文原著 App",
  },
  {
    t: "FLOWM 流记",
    y: "2026",
    cat: "Product",
    ar: 1.59,
    p: 2,
    img: "/works/ledger.png",
    label: "FLOWM 流记",
    desc: "轻量级复式记账 App",
  },
  {
    t: "grove",
    y: "2026",
    cat: "Product",
    ar: 0.56,
    p: 3,
    img: "/works/grove.png",
    label: "grove",
    desc: "manage your worktree in menu bar",
  },
  {
    t: "Journal TODO",
    y: "2026",
    cat: "Product",
    ar: 1.33,
    p: 4,
    img: "/works/journaltodo.png",
    label: "Journal TODO",
  },
  {
    t: "Supply Smart Official",
    y: "2026",
    cat: "Web",
    ar: 1.78,
    p: 5,
    img: "/works/supplysmart.png",
    label: "Supply Smart Official",
  },
  {
    t: "Limitless 320",
    y: "2026",
    cat: "Web",
    ar: 1.78,
    p: 0,
    img: "/works/limitless320.png",
    label: "Limitless 320",
  },
];

/* 占位色块调色板（每个主题一组，低饱和、成体系）。替换为真实图后可删除。 */
export const PALETTES: Record<Theme, string[]> = {
  dark: ["#3a4a5a", "#5a3a3f", "#4a4636", "#36504a", "#4a3a55", "#574030"],
  light: ["#c9d2da", "#dcc9c6", "#d6d2c2", "#c6d4ce", "#d2c9d8", "#ddd0c2"],
  paper: ["#c4b9a3", "#bba38f", "#b6ad8e", "#a9b39c", "#b3a3ad", "#c1a98a"],
};

export function placeholderBg(theme: Theme, idx: number): string {
  const arr = PALETTES[theme] || PALETTES.dark;
  return arr[idx % arr.length];
}
