/**
 * @purpose 单个作品卡片：有 work.img 则铺真实图、否则用占位色块,按宽高比铺设
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
      </div>
    </figure>
  );
}
