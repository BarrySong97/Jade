/**
 * @purpose 作品集页的静态数据与类型：Work/Contact 类型、INTRO 简介、WORKS 列表(真实产品图,托管在 R2)
 * @role    被 works.tsx / works-intro / work-card 引用的数据与类型单一来源
 * @deps    @/lib/site(TWITTER/TWITTER_HANDLE,联系方式复用首页社交链接)
 * @gotcha  图片走 R2(WebP,宽 2400/q88,经 scripts/upload-asset.mjs 上传);width/height/thumbhash 供 BlogImage blur-up。CONTACT 只展示 Twitter(与首页同源)。换图:upload-asset 产出新 url/尺寸/thumbhash 后改这里。
 */

import { TWITTER, TWITTER_HANDLE } from "@/lib/site";

/* 作品(均为真实产品图,托管 R2) */
export interface Work {
  t: string; // 标题(alt 用)
  y: string; // 年份
  cat: string; // 分类
  img: string; // R2 WebP 地址
  width: number;
  height: number;
  thumbhash: string; // blur-up 占位
  label: string; // 左下/左上角应用名标识
  desc?: string; // 标识里的一句说明
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

const R2 = "https://blogassets.4real.ink/works";

export const WORKS: Work[] = [
  {
    t: "FLOWM",
    y: "2026",
    cat: "Product",
    img: `${R2}/a91c90f16bbfedfb41a5000b9c603429.webp`,
    width: 1200,
    height: 630,
    thumbhash: "PPgBBIBBuntQiImId5qYf4sFpg==",
    label: "FLOWM",
    desc: "非对账记账软件",
  },
  {
    t: "Immersed",
    y: "2026",
    cat: "Product",
    img: `${R2}/4f9d15c37fa585ee052f3d4eb33ed834.webp`,
    width: 1200,
    height: 630,
    thumbhash: "n/cRFIQHaWiIdnhyeXffd/FtNw==",
    label: "Immersed",
    desc: "AI 辅助阅读英文原著 App",
  },
  {
    t: "FLOWM 流记",
    y: "2026",
    cat: "Product",
    img: `${R2}/10a74f8b89dbbb72f4cec350c28c6f93.webp`,
    width: 2400,
    height: 1507,
    thumbhash: "9veBA4QP2XUstI/JurCvaJdzlWifx4c=",
    label: "FLOWM 流记",
    desc: "轻量级复式记账 App",
  },
  {
    t: "grove",
    y: "2026",
    cat: "Product",
    img: `${R2}/7470173f4bf9a33d5f88196d65017218.webp`,
    width: 1080,
    height: 1920,
    thumbhash: "O/gBBADDnrg22Htp+bhVgDBuCQ==",
    label: "grove",
    desc: "manage your worktree in menu bar",
  },
  {
    t: "Journal TODO",
    y: "2026",
    cat: "Product",
    img: `${R2}/d102b28694d71ac461f742ed92e54428.webp`,
    width: 1920,
    height: 1440,
    thumbhash: "HvYRFYRwT3p2d4eUaIiIl0JuAFnH",
    label: "Journal TODO",
  },
  {
    t: "Supply Smart Official",
    y: "2026",
    cat: "Web",
    img: `${R2}/49e24727873abd303c73406ed4b07396.webp`,
    width: 1920,
    height: 1080,
    thumbhash: "uOcFDIIGNzaTiomTZ2UGpHNgag==",
    label: "Supply Smart Official",
  },
  {
    t: "Limitless 320",
    y: "2026",
    cat: "Web",
    img: `${R2}/6f13af35004c995287c7dd646d4ff130.webp`,
    width: 1920,
    height: 1080,
    thumbhash: "n/cJJIL45bpvdYd9lZMKaGaASg==",
    label: "Limitless 320",
  },
];
