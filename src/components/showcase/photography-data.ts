/**
 * @purpose 摄影页静态数据与常量：Photo 类型、PHOTOS 列表、fmtDate 日期格式化、拨盘几何常量(BASE_H/PEAK/PSPACING/SPREAD)
 * @role    被 photography.tsx 引用的数据/工具单一来源（PHOTOS 须按 date 倒序以匹配时间轴）
 * @deps    无运行时依赖（纯常量与工具函数）
 * @gotcha  Photo.duo 是占位双色调渐变、ar 是宽高比，接真实图后可删；拨盘常量直接决定刻度间距与中心起伏宽度，改动会影响 photography.tsx 的命令式动画
 */

/* 摄影数据与常量 */
export interface Photo {
  date: string; // YYYY-MM-DD
  title: string;
  ar: number; // 宽高比
  duo: [string, string]; // 占位双色调（替换为真实图后可删除）
}

export const PHOTOS: Photo[] = [
  { date: "2026-05-12", title: "晨雾 · 西湖", ar: 1.5, duo: ["#d7dde2", "#b3bcc4"] },
  { date: "2026-02-28", title: "雪后", ar: 0.78, duo: ["#e2e3e5", "#c2c4c8"] },
  { date: "2025-11-03", title: "山脊线", ar: 1.62, duo: ["#ddd5cd", "#bdb2a6"] },
  { date: "2025-08-19", title: "盛夏的午后", ar: 1.34, duo: ["#e3ddc9", "#c8c0a6"] },
  { date: "2025-06-07", title: "海边的人", ar: 0.8, duo: ["#cfdadd", "#aebcc1"] },
  { date: "2025-03-21", title: "旧城", ar: 1.5, duo: ["#ddd2d0", "#c0b1ad"] },
  { date: "2024-12-30", title: "年末", ar: 1.0, duo: ["#dadae0", "#bcbcc4"] },
  { date: "2024-09-14", title: "稻田", ar: 1.7, duo: ["#dde0c9", "#c1c5a4"] },
  { date: "2024-05-02", title: "雨", ar: 0.78, duo: ["#cfd6dd", "#adb7c1"] },
  { date: "2023-10-26", title: "枫", ar: 1.4, duo: ["#e0cfc4", "#c6ab9b"] },
  { date: "2023-04-11", title: "花期", ar: 1.5, duo: ["#ddd0dd", "#c0adc0"] },
  { date: "2022-07-08", title: "公路", ar: 1.78, duo: ["#d6dadf", "#b6bcc4"] },
  { date: "2021-01-17", title: "初雪", ar: 0.82, duo: ["#dcdee1", "#bfc2c7"] },
  { date: "2019-09-09", title: "起点", ar: 1.46, duo: ["#ded8cf", "#c3b9aa"] },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function fmtDate(iso: string): { y: string; md: string } {
  const [y, m, d] = iso.split("-");
  return { y, md: `${MONTHS[+m - 1]} ${+d}` };
}

/* 拨盘常量 */
export const BASE_H = 10; // 边缘刻度高度
export const PEAK = 34; // 中心额外升高
export const PSPACING = 17; // 相邻照片刻度间距(px)，越小越密
export const SPREAD = 2; // 起伏扩散范围（照片索引单位）—— 只影响左右各一根
