/**
 * @purpose 作品集页的静态数据与类型：Work 类型、INTRO 左栏文案、WORKS 列表(真实产品图,托管在 R2)
 * @role    被 works.tsx / work-detail / works-intro / work-card 引用的数据与类型单一来源
 * @deps    本目录 works-icons(WORK_ICONS / WorkIconKey)
 * @gotcha  左栏自述与作品说明通篇灰字、不加重点标记。年份行「{yearFrom} — {latest} 的部分作品」结束年用 `worksLatestYear()`,勿写死。姓名取自 `@/lib/site` 的 PROFILE.name。产品大图走 R2;`images[0]` 是列表封面;默认也是详情 morph 源。`detailSolo`+图上 `solo` 时详情只显示那张(官网长截图)、并关闭封面 morph。小图标走本地 `src/assets/works/icons/`。`url` 是项目公开页;`slug` 对应 `/products/<slug>`。`icon` 取值须在 WORK_ICONS 里有对应文件。展示名用 `displayWorkTitle`(`grove`→`Grove`,`foo-bar`→`Foo Bar`),数据里的 `t` 可保持原样。换图走 `upload-asset.mjs`,**必须用原文件路径**,勿用 Cursor 聊天附件(会被压糊)。
 */

import { type WorkIconKey } from "./works-icons";

/* 单张产品图(R2 WebP + blur-up 元信息) */
export interface WorkImage {
  img: string;
  width: number;
  height: number;
  thumbhash: string;
  /** 与 work.detailSolo 配合：详情唯一展示图 */
  solo?: boolean;
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
  images: WorkImage[]; // 至少一张;images[0] = 列表封面 / 默认详情 morph 源
  /** 详情只展示 images 里 solo=true 的图，并关闭封面 morph(官网长截图) */
  detailSolo?: boolean;
}

/** 列表封面(= images[0]) */
export function workCover(work: Work): WorkImage {
  return work.images[0];
}

/** 详情页要渲染的图：detailSolo 时只取 solo 标记图 */
export function workDetailImages(work: Work): WorkImage[] {
  if (!work.detailSolo) return work.images;
  const marked = work.images.filter((i) => i.solo);
  return marked.length > 0 ? marked : [work.images[0]];
}

/** detailSolo 时列表封面与详情图不是同一张 → 跳过 work-cover morph */
export function workSkipsCoverMorph(work: Work): boolean {
  return !!work.detailSolo;
}

/** 展示用项目名:`grove` → `Grove`;`foo-bar` → `Foo Bar`(连字符/下划线拆词,各词首字母大写) */
export function displayWorkTitle(name: string): string {
  return name
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getWorkBySlug(slug: string): Work | undefined {
  return WORKS.find((w) => w.slug === slug);
}

/** WORKS 里最新的年份(数字字符串),供左栏「2025 — {latest} 的部分作品」 */
export function worksLatestYear(): string {
  return String(Math.max(...WORKS.map((w) => Number(w.y))));
}

/* 左栏:几句灰色自述;`yearRange` 占位,由 works-intro 换成动态最新年 */
export const INTRO = {
  paras: ["只要是能做的，不限形式，不限技术栈"],
  yearFrom: "2025",
};

const R2 = "https://blogassets.4real.ink/works";

export const WORKS: Work[] = [
  {
    slug: "flowm",
    t: "FLOWM 流记",
    y: "2025",
    cat: "iOS",
    icon: "flowm",
    url: "https://flowm-official.vercel.app",
    desc: "正在做的复式记账 App，把资产、负债和现金流放进同一张表里",
    images: [
      {
        img: `${R2}/10a74f8b89dbbb72f4cec350c28c6f93.webp`,
        width: 2400,
        height: 1507,
        thumbhash: "9veBA4QP2XUstI/JurCvaJdzlWifx4c=",
      },
      /* 长图紧接封面 → 贪心装箱进右列,后续短图全堆左列 */
      {
        img: `${R2}/d50f6970f44bc7854b61ff53c8025a55.webp`,
        width: 2400,
        height: 9368,
        thumbhash: "edcFEgZ2cKeJnYg0ZGBvB3c=",
      },
      {
        img: `${R2}/9bce54cd7b6cb4351b719e7faed8f13e.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "4rYJJIQLyEhseIeWiFZWgDYEeg==",
      },
      {
        img: `${R2}/9d5cc3f556ea2d5ef3ae268ce6238828.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "47YJJIQL2EhseIeViWZWgEYBag==",
      },
      {
        img: `${R2}/aa8618228c2d998fc3f195f6f6ceba41.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "JscNJIYKiKhqiHeFiWc2gEUgSQ==",
      },
      {
        img: `${R2}/96537d8f543797322c2df9a5d37b32ff.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "J8cNJIQKiKh6iHeEeWg2gEUgSQ==",
      },
    ],
  },
  {
    slug: "flowm-desktop",
    t: "Flowm Desktop",
    y: "2026",
    cat: "macOS",
    icon: "flowm-desktop",
    url: "https://flowmoney.pages.dev",
    desc: "AI native 的 Flowm 桌面版：不再对账，用 Agent 整理数据，App 只做 UI 展示",
    images: [
      {
        img: `${R2}/a91c90f16bbfedfb41a5000b9c603429.webp`,
        width: 1200,
        height: 630,
        thumbhash: "PPgBBIBBuntQiImId5qYf4sFpg==",
      },
      {
        img: `${R2}/abcffa6798e8ab2c8f2d9faf63d37b70.webp`,
        width: 2400,
        height: 11343,
        thumbhash: "PvgBAQD1ebZolHiJGmSQz6Y=",
      },
      {
        img: `${R2}/d66a70381dbce0dd1094a9192f23d07d.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "JgYWNYI4WHiGd3eAeomIhid7gD34",
      },
      {
        img: `${R2}/20a854bf428013255282fcdccc478c76.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "JwYWNYI4WHiGd3eAenmIhid7gD74",
      },
      {
        img: `${R2}/18ea126e2e9250d58ab00f7717d2f8b7.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "JwYWNYI4WHiGd3eAenmIhid7kD74",
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
      {
        img: `${R2}/93ff294b41f26bfa90ca6bab64249635.webp`,
        width: 2400,
        height: 1263,
        thumbhash: "8/cJDIL36EeCeoqMdnf8hOhPaQ==",
      },
      {
        img: `${R2}/1b5fe78577e84fd20d0c3c34d97cf27b.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "occNPYZFZzeZiHhweKl3h3mQpvU3",
      },
      {
        img: `${R2}/55baa82b948cecbbfe33ba9f6a15b23f.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "JBgWFYQpmJd/h4h0eYdodq9y9S13",
      },
      {
        img: `${R2}/0bb45ca61d554cd8a38bd127c2ca7840.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "pNcNLYQGWHeJeHhwepl4hGmQleAn",
      },
    ],
  },
  {
    slug: "grove",
    t: "grove",
    y: "2026",
    cat: "macOS",
    icon: "grove",
    url: "https://groveworktree.pages.dev",
    desc: "menu bar 里的 git worktree 管理器，每个分支一个独立工作区",
    images: [
      {
        img: `${R2}/918d21c9365421ab480fd923c16aaea3.webp`,
        width: 1200,
        height: 630,
        thumbhash: "OvgBBIBmmXqnZnfvV2Vl4NgGrw==",
      },
      {
        img: `${R2}/2278b6767b4896b3787d16899eb50d4a.webp`,
        width: 2400,
        height: 4496,
        thumbhash: "PPgBBAD3J4a5VXU4esj1amRPBw==",
      },
      {
        img: `${R2}/7470173f4bf9a33d5f88196d65017218.webp`,
        width: 1080,
        height: 1920,
        thumbhash: "O/gBBADDnrg22Htp+bhVgDBuCQ==",
      },
    ],
  },
  {
    slug: "listen-up",
    t: "Listen Up",
    y: "2026",
    cat: "macOS",
    icon: "listen-up",
    url: "https://trylistenup.pages.dev",
    desc: "YouTube 字幕桌面 App，极轻量；靠 Chrome 扩展与页面通信，不嵌在网页里",
    images: [
      {
        img: `${R2}/59af2181e2687a961233e5234dac1409.webp`,
        width: 1200,
        height: 630,
        thumbhash: "8PcRDIBPxZR4d4d5eHdfhqiwmg==",
      },
      {
        img: `${R2}/716392ce539ddb4431ebdd79d690b8c5.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "WvUFLITyMYXEpomUtzcGg4b2yQ==",
      },
      {
        img: `${R2}/d2450da318ce9399e4fd9e4b7d06b0f3.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "q/YJJIIIMgiHl4hxqXYWhID1qQ==",
      },
    ],
  },
  {
    slug: "post",
    t: "Post",
    y: "2026",
    cat: "macOS",
    icon: "post",
    url: "https://topostt.pages.dev",
    desc: "本地优先的资产卡片管理器，用标签与视图整理笔记、图片和素材",
    images: [
      {
        img: `${R2}/843e4b775032d200870968d65f49d048.webp`,
        width: 1200,
        height: 630,
        thumbhash: "8/cJDII/h5NjiaaFeId/8cYZfw==",
      },
      /* 官网长图紧接封面 → 右列拉到底;后续短图堆左列 */
      {
        img: `${R2}/7cdd869a22e80332aac040be18f0bfd8.webp`,
        width: 2400,
        height: 3100,
        thumbhash: "+fcJDQCKd5B3Z2h4d3dpd2/w4gcv",
      },
      {
        img: `${R2}/782cae87b101c229c8f7f3e1df69bdb0.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "pAYKNIILYGOahZlkuWYGhYLAWA==",
      },
      {
        img: `${R2}/51f76d9938f61aaf9ae03c47d9bd7456.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "6QYKPIQFBmaHp3iBmXgHh6PxmQ==",
      },
      {
        img: `${R2}/fd7f9fe6014bc8bfd612ce55f4788eef.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "nQYGNIIZ8FSnlohwrmcGhYLyiQ==",
      },
      {
        img: `${R2}/27c75e4c05f23d6f79848c52bb7dab1c.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "nQYGNIIY8FSnhohwrmcGhYLyiQ==",
      },
      {
        img: `${R2}/47d929bb26fc620330f997d1ed20d866.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "rfYRLIIGR4eIh4iCiXgGhZP1qQ==",
      },
      {
        img: `${R2}/2df6444b9cc6d0615e2c96b7bb07cea7.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "rfYRLIIGR4eIh4iCiXgGhZL1qQ==",
      },
    ],
  },
  {
    slug: "journal-todo",
    t: "Journal TODO",
    y: "2026",
    cat: "macOS",
    icon: "journal-todo",
    url: "https://todo.4real.ltd",
    desc: "按天写的待办，一天一页、工作区分开，写完就关",
    images: [
      {
        img: `${R2}/d102b28694d71ac461f742ed92e54428.webp`,
        width: 1920,
        height: 1440,
        thumbhash: "HvYRFYRwT3p2d4eUaIiIl0JuAFnH",
      },
      {
        img: `${R2}/8cb188e0130b13ce73228ce9b7493698.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "adcJHIQOYylriYdwuWlGgFMRCg==",
      },
      {
        img: `${R2}/270c68a9e0c420c9263c4a394dbb6ed6.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "1qYJHIL7qWhqiYebdWhlgCcImg==",
      },
      {
        img: `${R2}/33a58eaa147f873671fd7db7b22aae81.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "KscRHIYJmJh6iIeFeXgWgFZAaQ==",
      },
      {
        img: `${R2}/b3db29f9aaa9339e1ac2c20906171e70.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "2rYJJIL8GLhreoaXd1dmgDcGig==",
      },
      {
        img: `${R2}/d191387befd4494122e7747afbd12715.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "26YFJIT9GLlteoaYhldmgDcIig==",
      },
      {
        img: `${R2}/cce4b298a1e809d5f69e6e3ee04372eb.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "27YJJIT8GLhteYaXhldmgDcHig==",
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
    detailSolo: true,
    images: [
      {
        img: `${R2}/49e24727873abd303c73406ed4b07396.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "uOcFDIIGNzaTiomTZ2UGpHNgag==",
      },
      {
        img: `${R2}/2e6e870ce812bb572a3ac14f39cf061c.webp`,
        width: 2400,
        height: 9844,
        thumbhash: "/fcBAgCVkfhEZ5CiqoHPCMk=",
        solo: true,
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
    detailSolo: true,
    images: [
      {
        img: `${R2}/6f13af35004c995287c7dd646d4ff130.webp`,
        width: 1920,
        height: 1080,
        thumbhash: "n/cJJIL45bpvdYd9lZMKaGaASg==",
      },
      {
        img: `${R2}/39a5f63f7a7e20e0f020c08ab1ed68d5.webp`,
        width: 2400,
        height: 9111,
        thumbhash: "YAgOAgB4fjd3d3CHXV/y5CM=",
        solo: true,
      },
    ],
  },
];
