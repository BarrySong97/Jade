/**
 * @purpose 单个作品卡片：当前用占位色块按宽高比铺设，左上角带序号编号（占位待替换为 <img>）
 * @role    被 works.tsx 在 WORKS.map 中逐个渲染；纯展示，背景色由 placeholderBg 取自浅色调色板
 * @deps    本目录 works-data(Work 类型、placeholderBg)
 * @gotcha  瀑布流靠父级 columns + break-inside-avoid，卡片须 inline-block 才不被列截断；字体用 font-[family-name:var(--mono)]，令牌见 src/styles/showcase.css，参 docs/modules/components/README.md
 */

import { type Work, placeholderBg } from "./works-data";

/* 单个作品（占位色块，替换为 <img> 即可） */
export default function WorkCard({ work, index }: { work: Work; index: number }) {
  return (
    <figure className="mb-3 inline-block w-full break-inside-avoid">
      <div
        className="relative flex w-full items-end overflow-hidden rounded-[3px] transition-[background] duration-500"
        style={{ background: placeholderBg("light", work.p), aspectRatio: String(work.ar) }}
      >
        <span className="absolute left-[13px] top-3 font-[family-name:var(--mono)] text-[11px] tracking-[0.05em] text-white/50 mix-blend-difference">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </figure>
  );
}
