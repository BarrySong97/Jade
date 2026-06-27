/**
 * @purpose 博客正文图片组件:blur-up 渐进加载——thumbhash 平均色(瞬时)+ 模糊图打底,真图加载完 opacity 淡入盖上;点击放大走 WebGL viewer。
 * @role    MDX 中由 scripts/img.mjs 改写生成的 <BlogImage/>;blog 专用,替代老 cloud-image 占位机制。
 * @deps    react;thumbhash(thumbHashToDataURL / thumbHashToAverageRGBA);@/components/webgl-viewer;@/lib/utils(cn)
 * @gotcha  平均色作 background-color 首帧即绘(免解码白屏)是 blur-up 不白的关键;真图淡入期间背后始终是模糊图。详见 docs/topics/blog-images.md
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { thumbHashToDataURL, thumbHashToAverageRGBA } from "thumbhash";
import { cn } from "@/lib/utils";
import { WebGLImageViewer } from "@/components/webgl-viewer";

interface BlogImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** 脚本生成的 thumbhash(base64);缺省则退化为无占位 */
  thumbhash?: string;
  className?: string;
  /** 是否可点击放大查看原图,默认 true */
  zoomable?: boolean;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin =
    typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default function BlogImage({
  src,
  alt,
  width,
  height,
  thumbhash,
  className,
  zoomable = true,
}: BlogImageProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // thumbhash → { 平均色(瞬时绘制,免白屏), 模糊图 dataURL }。SSR 与客户端都算,首帧即有占位。
  const placeholder = useMemo(() => {
    if (!thumbhash) return null;
    try {
      const bytes = base64ToBytes(thumbhash);
      const { r, g, b, a } = thumbHashToAverageRGBA(bytes);
      const avg = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      return { avg, url: thumbHashToDataURL(bytes) };
    } catch {
      return null;
    }
  }, [thumbhash]);

  // 真图加载完成(含水合前已缓存命中的情况)→ 触发淡入
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    const onLoad = () => setLoaded(true);
    img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [src]);

  // Esc 关闭 lightbox
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <figure
        className={cn("relative overflow-hidden rounded-md", className)}
        style={{
          aspectRatio: `${width}/${height}`,
          // 平均色瞬时绘制(无需解码,杜绝首帧白屏),模糊图随后盖上
          backgroundColor: placeholder?.avg,
          backgroundImage: placeholder ? `url(${placeholder.url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 真图加载完 opacity 0→1 淡入,盖在模糊图上(blur-up);淡入期间背后始终是平均色+模糊图,绝不白 */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onClick={zoomable ? () => setOpen(true) : undefined}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-700 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            zoomable && "cursor-zoom-in",
          )}
        />
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="图片查看器"
        >
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <WebGLImageViewer src={src} className="h-full w-full" />
        </div>
      )}
    </>
  );
}
