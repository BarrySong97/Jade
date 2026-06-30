/**
 * @purpose 单个作品卡片：用 BlogImage 渲染托管在 R2 的产品图(blur-up 渐进加载),左上/左下角叠应用名标识徽标
 * @role    被 works.tsx 在 WORKS.map 中逐个渲染;纯展示
 * @deps    本目录 works-data(Work 类型)、@/components/blogs/blog-image(BlogImage,复用博客图 blur-up)、@/lib/utils(cn)
 * @gotcha  复用 BlogImage 但 zoomable=false(瀑布流卡不开灯箱);徽标 pointer-events-none 叠在外层 relative 容器上。竖图(height>width)徽标放左上角、横图放左下角(底部易被裁)。令牌见 src/styles/showcase.css
 */

import { cn } from "@/lib/utils";
import { type Work } from "./works-data";
import BlogImage from "@/components/blogs/blog-image";

export default function WorkCard({ work }: { work: Work }) {
  const portrait = work.height > work.width;
  return (
    <div className="mb-3 w-full">
      <div className="relative">
        <BlogImage
          src={work.img}
          alt={work.t}
          width={work.width}
          height={work.height}
          thumbhash={work.thumbhash}
          zoomable={false}
          className="rounded-[3px]"
        />
        {/* 应用标识(半透明黑底白字、圆角,类 Twitter 链接卡域名标):应用名 — 一句说明,一排 */}
        {work.label && (
          <span
            className={cn(
              "pointer-events-none absolute left-3 whitespace-nowrap rounded-[10px] bg-black/55 px-3 py-1.5 text-[13.5px] leading-none tracking-[0.01em] text-white backdrop-blur-md",
              portrait ? "top-3" : "bottom-3",
            )}
          >
            <span className="font-semibold">{work.label}</span>
            {work.desc && <> — {work.desc}</>}
          </span>
        )}
      </div>
    </div>
  );
}
