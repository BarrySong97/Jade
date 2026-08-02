/**
 * @purpose 作品集项目详情：左栏项目 Header(返回+右上角图标 / 名+年份·平台 / url / 说明)+ 底角头像栏 + 右栏图片瀑布流
 * @role    被 products/[slug].astro 以 client:load 挂载;纯展示
 * @deps    本目录 works-data(Work/workDetailImages/workSkipsCoverMorph/WorkImage)、works-icons(WORK_ICONS)、works-avatar-bar、@/components/blogs/blog-image
 * @gotcha  默认首图 `data-work-cover` 供 morph;`detailSolo` 时不挂、右栏只渲染 solo 图且全宽(官网长截图不收半宽)。文案块 `data-works-aside` 横滑转场;头像栏 `data-works-avatar` 单独挂名。右栏**只放本项目图**;两列贪心装箱;单张竖图(非 detailSolo)收到半宽;详情图走 BlogImage 灯箱。
 */

import {
  type Work,
  type WorkImage,
  displayWorkTitle,
  workDetailImages,
  workSkipsCoverMorph,
} from "./works-data";
import { WORK_ICONS } from "./works-icons";
import WorksAvatarBar from "./works-avatar-bar";
import BlogImage from "@/components/blogs/blog-image";

const COLS = 2;

function displayHost(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/* 保持顺序,逐张丢进当前最矮的一列(贪心装箱 → 静态 masonry);空列滤掉,图少时占满整宽 */
function packColumns(images: WorkImage[]) {
  const cols: { image: WorkImage; index: number }[][] = Array.from({ length: COLS }, () => []);
  const heights = Array.from({ length: COLS }, () => 0);
  images.forEach((image, index) => {
    const c = heights.indexOf(Math.min(...heights));
    cols[c].push({ image, index });
    heights[c] += image.height / image.width;
  });
  return cols.filter((col) => col.length > 0);
}

export default function WorkDetail({ work }: { work: Work }) {
  const icon = WORK_ICONS[work.icon];
  const title = displayWorkTitle(work.t);
  const images = workDetailImages(work);
  const skipMorph = workSkipsCoverMorph(work);
  const columns = packColumns(images);
  /* 只有一张竖图时占满整宽会高到两屏 → 收到半宽;detailSolo 官网长图例外,保持全宽 */
  const solo = !skipMorph && images.length === 1 ? images[0] : null;
  const soloPortrait = !!solo && solo.height > solo.width;

  return (
    <div className="works-page grid min-h-screen grid-cols-[minmax(280px,30%)_1fr] items-start bg-[var(--bg)] text-[15px] leading-[1.62] tracking-[-0.006em] text-[var(--fg)] max-[880px]:grid-cols-[1fr]">
      <aside className="sticky top-0 flex min-h-screen flex-col self-start px-[clamp(28px,3.4vw,60px)] pt-[clamp(30px,4.4vh,56px)] pr-[clamp(32px,3.6vw,66px)] pb-[clamp(28px,3.4vw,60px)] max-[880px]:static max-[880px]:mb-[34px] max-[880px]:min-h-0 max-[880px]:border-b max-[880px]:border-[var(--line)] max-[880px]:pb-[34px]">
        <div data-works-aside className="min-h-0 flex-1 overflow-hidden">
          <div className="mb-[clamp(24px,4vh,42px)] flex items-center justify-between gap-[12px]">
            <a
              href="/products"
              className="font-[family-name:var(--mono)] text-[12px] tracking-[0.04em] text-[var(--fg-3)] no-underline transition-colors duration-200 hover:text-[var(--fg)]"
            >
              ← 返回
            </a>
            <img
              src={icon.src}
              alt=""
              width={22}
              height={22}
              className="size-[22px] shrink-0 rounded-[5px]"
            />
          </div>

          <div>
            <div className="flex items-center gap-[9px]">
              <h1 className="m-0 text-[14px] font-[450] leading-none tracking-[-0.005em] text-[var(--fg)]">
                {title}
              </h1>
              <span className="ml-auto font-[family-name:var(--mono)] text-[10.5px] uppercase leading-none tracking-[0.13em] text-[var(--fg-3)]">
                {work.y} · {work.cat}
              </span>
            </div>
            <a
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0 inline-block font-[family-name:var(--mono)] text-[10.5px] leading-none tracking-[0.01em] text-[var(--fg-3)] no-underline transition-colors duration-200 hover:text-[var(--fg)]"
            >
              {displayHost(work.url)}
            </a>
          </div>

          <p className="mt-[clamp(24px,4vh,42px)] m-0 max-w-[34em] text-[15px] leading-[1.7] text-[var(--fg-2)] [text-wrap:pretty]">
            {work.desc}
          </p>
        </div>

        <WorksAvatarBar />
      </aside>

      <div className="flex min-w-0 items-start gap-[clamp(12px,1.4vw,20px)] pt-[clamp(30px,4.4vh,56px)] pr-[clamp(28px,3.4vw,60px)] pb-[22vh] max-[1180px]:flex-col max-[1180px]:gap-[clamp(12px,1.4vw,20px)] max-[880px]:px-[clamp(28px,3.4vw,60px)] max-[880px]:pt-0 max-[880px]:pb-[18vh]">
        {columns.map((col, ci) => (
          <div
            key={ci}
            className={`flex min-w-0 flex-1 flex-col gap-[clamp(12px,1.4vw,20px)] max-[1180px]:w-full ${
              soloPortrait ? "max-w-[52%] max-[1180px]:max-w-none" : ""
            }`}
          >
            {col.map(({ image, index }) => (
              <div
                key={image.img}
                {...(!skipMorph && index === 0 ? { "data-work-cover": work.slug } : {})}
              >
                <BlogImage
                  src={image.img}
                  alt={index === 0 ? title : `${title} ${index + 1}`}
                  width={image.width}
                  height={image.height}
                  thumbhash={image.thumbhash}
                  zoomable
                  className="rounded-[3px]"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
