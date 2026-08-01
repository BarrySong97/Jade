/**
 * @purpose 作品集页的静态数据与类型：Work 类型、INTRO 左栏文案、WORKS 列表(真实产品图,托管在 R2)
 * @role    被 works.tsx / work-detail / works-intro / work-card 引用的数据与类型单一来源
 * @deps    本目录 works-icons(WORK_ICONS / WorkIconKey)
 * @gotcha  左栏自述与作品说明通篇灰字、不加重点标记。姓名取自 `@/lib/site` 的 PROFILE.name。产品大图走 R2;`images[0]` 是列表封面与详情转场源。小图标走本地 `src/assets/works/icons/`。`url` 是项目公开页;`slug` 对应 `/products/<slug>`。`icon` 取值须在 WORK_ICONS 里有对应文件。
 */

import { type WorkIconKey } from "./works-icons";

/* 单张产品图(R2 WebP + blur-up 元信息) */
export interface WorkImage {
  img: string;
  width: number;
  height: number;
  thumbhash: string;
}

/* 作品(产品大图托管 R2;图标本地) */
export interface Work {
  slug: string; // 路由 /products/<slug>
  t: string; // 项目名(也作图片 alt)
  y: string; // 年份
  cat: string; // 平台:iOS / macOS / Web
  icon: WorkIconKey; // 名字左侧 App / 品牌图标,见 works-icons
  url: string; // 项目公开页(App / 官网 / GitHub)
  desc: string; // 一句说明(通篇灰字,不加重点标记)
  images: WorkImage[]; // 至少一张;images[0] = 列表封面 / 详情 morph 源
}

/** 列表封面(= images[0]) */
export function workCover(work: Work): WorkImage {
  return work.images[0];
}

export function getWorkBySlug(slug: string): Work | undefined {
  return WORKS.find((w) => w.slug === slug);
}

/* 左栏:几句灰色自述 */
export const INTRO = {
  paras: [
    "像 flowm（复式记账）、immersed（读英文原著）和 grove（git worktree），都是一个人从设计做到上线",
    "也替别人做官网与产品页，前端到部署一并交付",
    "健身、学英语，偶尔写点东西；这里是 2019 — 2026 的部分作品",
    "接项目 · 也乐意聊聊想法",
  ],
};

const R2 = "https://blogassets.4real.ink/works";

export const WORKS: Work[] = [
  {
    slug: "flowm",
    t: "FLOWM 流记",
    y: "2026",
    cat: "iOS",
    icon: "flowm",
    url: "https://flowmoney.pages.dev",
    desc: "正在做的复式记账 App，把资产、负债和现金流放进同一张表里",
    images: [
      {
        img: `${R2}/10a74f8b89dbbb72f4cec350c28c6f93.webp`,
        width: 2400,
        height: 1507,
        thumbhash: "9veBA4QP2XUstI/JurCvaJdzlWifx4c=",
      },
    ],
  },
  {
    slug: "immersed",
    t: "Immersed",
    y: "2026",
    cat: "iOS",
    icon: "immersed",
    url: "https://immersed-beta.vercel.app",
    desc: "用 AI 陪着读英文原著，查词与释义都留在书页里",
    images: [
      {
        img: `${R2}/4f9d15c37fa585ee052f3d4eb33ed834.webp`,
        width: 1200,
        height: 630,
        thumbhash: "n/cRFIQHaWiIdnhyeXffd/FtNw==",
      },
    ],
  },
  {
    slug: "grove",
    t: "grove",
    y: "2026",
    cat: "macOS",
    icon: "grove",
    url: "https://github.com/BarrySong97/grove",
    desc: "menu bar 里的 git worktree 管理器，每个分支一个独立工作区",
    images: [
      {
        img: `${R2}/7470173f4bf9a33d5f88196d65017218.webp`,
        width: 1080,
        height: 1920,
        thumbhash: "O/gBBADDnrg22Htp+bhVgDBuCQ==",
      },
    ],
  },
  {
    slug: "journal-todo",
    t: "Journal TODO",
    y: "2026",
    cat: "macOS",
    icon: "journal-todo",
    url: "https://journal-todo.vercel.app",
    desc: "按天写的待办，一天一页、工作区分开，写完就关",
    images: [
      {
        img: `${R2}/d102b28694d71ac461f742ed92e54428.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "HvYRFYRwT3p2d4eUaIiIl0JuAFnH",
      },
    ],
  },
  {
    slug: "supplysmart",
    t: "SupplySmart",
    y: "2026",
    cat: "Web",
    icon: "supplysmart",
    url: "https://supplysmart.net",
    desc: "为原料供应商做的 AI 外呼与情报平台官网，从设计到上线一个人完成",
    images: [
      {
        img: `${R2}/49e24727873abd303c73406ed4b07396.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "uOcFDIIGNzaTiomTZ2UGpHNgag==",
      },
    ],
  },
  {
    slug: "limitless-320",
    t: "Limitless 320",
    y: "2026",
    cat: "Web",
    icon: "limitless-320",
    url: "https://limitless320.com",
    desc: "西雅图一家战略咨询公司的官网，大图与衬线标题撑起首屏",
    images: [
      {
        img: `${R2}/6f13af35004c995287c7dd646d4ff130.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "n/cJJIL45bpvdYd9lZMKaGaASg==",
      },
    ],
  },
];
