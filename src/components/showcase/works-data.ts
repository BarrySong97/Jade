/**
 * @purpose 作品集页的静态数据与类型：Theme/Work/Contact 类型、INTRO 简介、WORKS 列表、PALETTES 占位调色板及 placeholderBg 取色函数
 * @role    被 works.tsx / works-intro / work-card 引用的数据与类型单一来源
 * @deps    无运行时依赖（纯常量与工具函数）
 * @gotcha  Work.p 是调色板索引、ar 是宽高比；PALETTES 每主题各 6 色，placeholderBg 按 idx 取模循环，接真实图后这些占位可删
 */

/* 作品集数据 */
export type Theme = "dark" | "light" | "paper";

export interface Work {
  t: string; // 标题
  y: string; // 年份
  cat: string; // 分类
  ar: number; // 宽高比
  p: number; // 调色板序号（占位用）
  img?: string; // 真实图路径（public/ 下，设置后渲染 <img> 取代占位色块）
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
  contact: [
    { label: "Email", value: "hi@lenshen.com", url: "mailto:hi@lenshen.com" },
    { label: "Instagram", value: "@lenshen", url: "#" },
    { label: "X / Twitter", value: "@lenshen", url: "#" },
  ] as Contact[],
};

export const WORKS: Work[] = [
  { t: "FLOWM 记账", y: "2026", cat: "Product", ar: 1.9, p: 1, img: "/works/flowm.png" },
  { t: "Immersed 沉浸阅读", y: "2026", cat: "Product", ar: 1.9, p: 0, img: "/works/immersed.png" },
  // 以下为占位色块(尚无真图);保留少量以便看出瀑布流的无限循环,接真图后再增删
  { t: "Halcyon 品牌系统", y: "2026", cat: "Branding", ar: 0.74, p: 0 },
  { t: "潮汐 · 阅读器", y: "2026", cat: "Product", ar: 1.34, p: 1 },
  { t: "山海经 · 插画集", y: "2025", cat: "Illustration", ar: 0.78, p: 2 },
  { t: "Monospace 字体实验", y: "2025", cat: "Type", ar: 1.0, p: 3 },
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
