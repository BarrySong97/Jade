/**
 * @purpose 博客正文横向图片条:一排图等高(默认 300px)、宽度各按自身比例自适应,超出部分横向滚动;不放任何文字,说明单独写在条子下方。
 * @role    MDX 里用 `<ImageStrip client:visible images={[...]} />`,适合一次展示一组图(如作品截图)又不想把文章拉得很长。
 * @deps    react;./blog-image(逐张复用其 thumbhash 占位、blur-up 与 layoutId 灯箱);@/lib/utils(cn)
 * @gotcha  **不劫持纵向滚轮**——这点和 showcase 的 photo-stream 相反:那是整页体验,把 deltaY 转成横滚是对的;正文里的条子若也转,鼠标划过它时页面就滚不动了。横向滚动交给触控板横扫 / 触屏原生 + 鼠标拖拽(只认 pointerType==="mouse",触屏走原生免得打架)。拖过 3px 就在捕获阶段吞掉 click,否则松手会误开灯箱。等高靠容器上的 `--strip-h` + 每张图 `h-[var(--strip-h)] w-auto`(BlogImage 的 figure 自带 aspect-ratio,给了定高宽度就自己算出来)。两条样式在 global.css 而非这里:① `.prose figure{margin:1.6em 0}` 会把行内每张图撑开错位,得压掉(那条手写 .prose 规则无层级,Tailwind 工具类盖不住);② 滚动条只在 `(pointer: fine)` 下显示,媒体查询 + ::-webkit-scrollbar 伪元素工具类写不了。另:`overflow-y` 写 `clip` 没用——与 `overflow-x:auto` 搭配时 clip 的used value 就是 hidden。images 数组目前需手写:`pnpm img` 只会把 `![]()` 改写成 `<BlogImage>` 标签,要入条子得把标签上的 src/alt/width/height/thumbhash 誊进数组。
 */
import { useEffect, useRef } from "react";
import BlogImage from "./blog-image";
import { cn } from "@/lib/utils";

export interface StripImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** 图片管线生成的 thumbhash(base64);缺省则该图无占位 */
  thumbhash?: string;
}

interface ImageStripProps {
  images: StripImage[];
  /** 统一行高(px),各图宽度按自身比例算出来 */
  height?: number;
  /** 屏幕阅读器里这条图的说明 */
  label?: string;
  className?: string;
}

// 超过这个位移就算「拖动」而非「点击」,松手时吞掉 click
const DRAG_THRESHOLD = 3;

export default function ImageStrip({
  images,
  height = 300,
  label = "横向图片条",
  className,
}: ImageStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // 鼠标拖拽横滚。触控板横扫与触屏靠 overflow-x-auto 原生处理,这里只补鼠标。
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType !== "mouse") return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = track.scrollLeft;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) moved = true;
      track.scrollLeft = startScroll - dx;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    // 捕获阶段吞掉拖动尾巴上的那次 click,免得松手就弹出灯箱
    const onClickCapture = (event: MouseEvent) => {
      if (!moved) return;
      moved = false;
      event.preventDefault();
      event.stopPropagation();
    };

    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    track.addEventListener("click", onClickCapture, true);
    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      style={{ "--strip-h": `${height}px` } as React.CSSProperties}
      className={cn(
        // 滚动条按指针类型显隐 + 配色在 global.css(媒体查询 + ::-webkit-scrollbar,工具类表达不了)
        "image-strip my-[1.6em] flex cursor-grab gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain",
        className,
      )}
    >
      {images.map((image) => (
        <BlogImage
          key={image.src}
          {...image}
          // 定高 + 宽度交给 BlogImage figure 上的 aspect-ratio 自己算
          className="h-[var(--strip-h)] w-auto shrink-0"
        />
      ))}
    </div>
  );
}
