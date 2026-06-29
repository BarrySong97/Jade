/**
 * @purpose 单个作品卡片：有 work.img 则铺真实图(右上角可叠 work.label 黑底白字应用标)、否则用占位色块,按宽高比铺设
 * @role    被 works.tsx 在 WORKS.map 中逐个渲染；纯展示,占位背景色由 placeholderBg 取自浅色调色板
 * @deps    本目录 works-data(Work 类型、placeholderBg)
 * @gotcha  瀑布流靠父级 columns + break-inside-avoid，卡片须 inline-block 才不被列截断；令牌见 src/styles/showcase.css，参 docs/modules/components/README.md
 */

import { type Work, placeholderBg } from "./works-data";

/* 单个作品（work.img 渲染真实图,否则占位色块） */
export default function WorkCard({ work }: { work: Work }) {
  return (
    <figure className="mb-3 inline-block w-full break-inside-avoid">
      <div
        className="relative w-full overflow-hidden rounded-[3px] transition-[background] duration-500"
        style={{
          background: work.img ? "var(--surface-2)" : placeholderBg("light", work.p),
          aspectRatio: String(work.ar),
        }}
      >
        {work.img && (
          <img
            src={work.img}
            alt={work.t}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* 左下角应用标识(半透明黑底白字、圆角,类 Twitter 链接卡域名标):应用名 — 一句说明,一排 */}
        {work.img && work.label && (
          <span className="pointer-events-none absolute bottom-3 left-3 whitespace-nowrap rounded-[10px] bg-black/55 px-3 py-1.5 text-[13.5px] leading-none tracking-[0.01em] text-white backdrop-blur-md">
            <span className="font-semibold">{work.label}</span>
            {work.desc && <> — {work.desc}</>}
          </span>
        )}
      </div>
    </figure>
  );
}
