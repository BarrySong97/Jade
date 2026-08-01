/**
 * @purpose 单个作品条目：头部行(图标 + 项目名 + 右侧「年份 · 平台」)+ 名下 URL + 一句说明 + 一张封面图;整卡进详情
 * @role    被 works.tsx 在两列里逐个渲染;纯展示,载入时按 index 错开一次轻微上浮
 * @deps    本目录 works-data(Work/workCover)、works-icons(WORK_ICONS)、@/components/blogs/blog-image(BlogImage)
 * @gotcha  整卡用底层透明链接触达详情 + 上层 pointer-events-none,外链 URL 单独 pointer-events-auto(避免 a 套 a)。封面外包 `data-work-cover` 供列表↔详情 morph。BlogImage zoomable=false。
 */

import { type Work, workCover } from "./works-data";
import { WORK_ICONS } from "./works-icons";
import BlogImage from "@/components/blogs/blog-image";

function displayHost(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function WorkCard({ work, index }: { work: Work; index: number }) {
  const icon = WORK_ICONS[work.icon];
  const cover = workCover(work);

  return (
    <article className="works-rise relative" style={{ animationDelay: `${index * 70 + 40}ms` }}>
      <a href={`/products/${work.slug}`} className="absolute inset-0 z-0" aria-label={work.t} />
      <div className="pointer-events-none relative z-10">
        <div className="mb-[1.5em] flex items-start gap-[9px]">
          <img
            src={icon.src}
            alt=""
            width={22}
            height={22}
            className="mt-[1px] size-[22px] shrink-0 rounded-[5px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[9px]">
              <span className="text-[14px] font-[450] leading-none tracking-[-0.005em] text-[var(--fg)]">
                {work.t}
              </span>
              <span className="ml-auto font-[family-name:var(--mono)] text-[10.5px] uppercase leading-none tracking-[0.13em] text-[var(--fg-3)]">
                {work.y} · {work.cat}
              </span>
            </div>
            <a
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto mt-0 inline-block font-[family-name:var(--mono)] text-[10.5px] leading-none tracking-[0.01em] text-[var(--fg-3)] no-underline transition-colors duration-200 hover:text-[var(--fg)]"
            >
              {displayHost(work.url)}
            </a>
          </div>
        </div>

        <p className="m-0 max-w-[36em] text-[15px] leading-[1.7] text-[var(--fg-2)] [text-wrap:pretty]">
          {work.desc}
        </p>

        <div className="mt-[1.65em]" data-work-cover={work.slug}>
          <BlogImage
            src={cover.img}
            alt={work.t}
            width={cover.width}
            height={cover.height}
            thumbhash={cover.thumbhash}
            zoomable={false}
            className="rounded-[3px] ring-1 ring-[var(--line)]"
          />
        </div>
      </div>
    </article>
  );
}
