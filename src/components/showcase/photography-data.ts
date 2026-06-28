/**
 * @purpose 摄影数据与常量：Album/Photo 类型、ALBUMS 图集列表、派生 COVERS、fmtDate、拨盘几何常量
 * @role    被 photo-stream / photos.astro(列表) / photos/[album].astro(详情) 引用的数据单一来源（ALBUMS 按 date 倒序以匹配时间轴）
 * @deps    无运行时依赖（纯常量与工具函数）
 * @gotcha  photos[0] 即封面（列表展示、详情第一张）；duo 是占位双色调、ar 是宽高比，接真实图后换 src；拨盘常量影响 photo-stream 的命令式动画
 */

/* 单张照片 */
export interface Photo {
  ar: number; // 宽高比
  duo: [string, string]; // 占位双色调渐变（替换为真实图后可删）
}

/* 图集：列表每项=一个图集，详情展示其全部照片 */
export interface Album {
  slug: string; // 路由 /photos/<slug>
  title: string;
  date: string; // YYYY-MM-DD，代表日期（列表日期拨盘按它）
  photos: Photo[]; // 有序；photos[0] = 封面
}

export const ALBUMS: Album[] = [
  {
    slug: "morning-west-lake",
    title: "晨雾 · 西湖",
    date: "2026-05-12",
    photos: [
      { ar: 1.5, duo: ["#d7dde2", "#b3bcc4"] },
      { ar: 0.8, duo: ["#cfd6dd", "#adb7c1"] },
      { ar: 1.46, duo: ["#dde0e6", "#bcc4cf"] },
      { ar: 1.34, duo: ["#d2dadf", "#b0bcc6"] },
    ],
  },
  {
    slug: "after-snow",
    title: "雪后",
    date: "2026-02-28",
    photos: [
      { ar: 0.78, duo: ["#e2e3e5", "#c2c4c8"] },
      { ar: 1.5, duo: ["#e6e7e9", "#cacccf"] },
      { ar: 1.0, duo: ["#dadae0", "#bcbcc4"] },
    ],
  },
  {
    slug: "ridgeline",
    title: "山脊线",
    date: "2025-11-03",
    photos: [
      { ar: 1.62, duo: ["#ddd5cd", "#bdb2a6"] },
      { ar: 1.7, duo: ["#dde0c9", "#c1c5a4"] },
      { ar: 0.82, duo: ["#dcdee1", "#bfc2c7"] },
      { ar: 1.4, duo: ["#e0cfc4", "#c6ab9b"] },
    ],
  },
  {
    slug: "midsummer-afternoon",
    title: "盛夏的午后",
    date: "2025-08-19",
    photos: [
      { ar: 1.34, duo: ["#e3ddc9", "#c8c0a6"] },
      { ar: 0.8, duo: ["#cfdadd", "#aebcc1"] },
      { ar: 1.5, duo: ["#ddd2d0", "#c0b1ad"] },
    ],
  },
  {
    slug: "old-town",
    title: "旧城",
    date: "2025-03-21",
    photos: [
      { ar: 1.5, duo: ["#ddd2d0", "#c0b1ad"] },
      { ar: 1.0, duo: ["#dadae0", "#bcbcc4"] },
      { ar: 0.78, duo: ["#cfd6dd", "#adb7c1"] },
      { ar: 1.78, duo: ["#d6dadf", "#b6bcc4"] },
    ],
  },
  {
    slug: "rice-fields",
    title: "稻田",
    date: "2024-09-14",
    photos: [
      { ar: 1.7, duo: ["#dde0c9", "#c1c5a4"] },
      { ar: 1.46, duo: ["#ded8cf", "#c3b9aa"] },
      { ar: 1.5, duo: ["#ddd0dd", "#c0adc0"] },
    ],
  },
  {
    slug: "bloom",
    title: "花期",
    date: "2023-04-11",
    photos: [
      { ar: 1.5, duo: ["#ddd0dd", "#c0adc0"] },
      { ar: 0.82, duo: ["#dcdee1", "#bfc2c7"] },
      { ar: 1.4, duo: ["#e0cfc4", "#c6ab9b"] },
    ],
  },
];

/* 列表用：每个图集的封面（photos[0]）+ 元信息 */
export const COVERS = ALBUMS.map((a) => ({
  slug: a.slug,
  title: a.title,
  date: a.date,
  ar: a.photos[0].ar,
  duo: a.photos[0].duo,
}));

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
export const PSPACING = 17; // 相邻刻度间距(px)，越小越密
export const SPREAD = 2; // 起伏扩散范围（索引单位）—— 只影响左右各一根
