import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { parseCloudImageKey, getBlurHashKey } from "@/lib/cloud-image-utils";
import { CLOUD_IMAGE_DOMAIN } from "@/lib/cloud-image-config";
import { WebGLImageViewer } from "@/components/webgl-viewer";

interface CloudImageProps {
  /** 图片 Key，需符合命名规则以解析尺寸（如：photo_cover_1920x1080.webp） */
  src: string;
  /** 图片描述 */
  alt: string;
  /** 自定义样式类 */
  className?: string;
  /** 原图 Key，传入则启用 Lightbox 点击查看原图 */
  originalSrc?: string;
  /** 图片加载策略，默认 lazy */
  loading?: "lazy" | "eager";
  /** 是否禁用 BlurHash 占位 */
  disableBlurHash?: boolean;
}

export function CloudImage({
  src,
  alt,
  className,
  originalSrc,
  loading = "lazy",
  disableBlurHash = false,
}: CloudImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const parsed = parseCloudImageKey(src);
  const blurHashKey = disableBlurHash ? null : getBlurHashKey(src);

  // 拼接完整 URL
  const imageUrl = `${CLOUD_IMAGE_DOMAIN}${src}`;
  const blurHashUrl = blurHashKey ? `${CLOUD_IMAGE_DOMAIN}${blurHashKey}` : null;
  const originalUrl = originalSrc ? `${CLOUD_IMAGE_DOMAIN}${originalSrc}` : undefined;

  const aspectRatio = parsed ? `${parsed.width}/${parsed.height}` : undefined;
  const enableLightbox = !!originalSrc;

  const handleClick = () => {
    if (enableLightbox) {
      setIsLightboxOpen(true);
    }
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Handle Escape key to close lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseLightbox();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  // 确保即便图片在水合前已加载/失败，也能正确更新状态
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setHasError(false);
      setIsLoaded(true);
    };
    const handleError = () => {
      setIsLoaded(false);
      setHasError(true);
    };

    // 如果图片已经加载完成（在水合之前）
    if (img.complete && img.naturalWidth > 0) {
      handleLoad();
      return;
    }

    // 图片尚未加载完成，重置状态并监听事件
    setIsLoaded(false);
    setHasError(false);

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [imageUrl]);

  return (
    <>
      <div
        className={cn("relative overflow-hidden", className)}
        style={{ aspectRatio }}
        onClick={handleClick}
        role={enableLightbox ? "button" : undefined}
        tabIndex={enableLightbox ? 0 : undefined}
        onKeyDown={
          enableLightbox
            ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
            : undefined
        }
      >
        {/* BlurHash 占位图 */}
        {blurHashUrl && !hasError && (
          <img
            src={blurHashUrl}
            alt=""
            aria-hidden="true"
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              "scale-110 blur-[20px]",
              "transition-opacity duration-300",
              isLoaded && "opacity-0"
            )}
          />
        )}
        {/* 无 BlurHash 时的灰色模糊占位 */}
        {!blurHashUrl && !hasError && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 h-full w-full",
              "bg-muted",
              "blur-md",
              "transition-opacity duration-300",
              isLoaded && "opacity-0"
            )}
          />
        )}

        {/* 主图 */}
        <img
          src={imageUrl}
          alt={alt}
          loading={loading}
          ref={imgRef}
          className={cn(
            "h-full w-full object-cover",
            "transition-opacity duration-300 ease-in-out",
            !isLoaded && !hasError ? "opacity-0" : "opacity-100",
            enableLightbox && "cursor-zoom-in"
          )}
        />

        {/* 错误状态 */}
        {hasError && (
          <div className="bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center">
            <span className="text-sm">图片加载失败</span>
          </div>
        )}
      </div>

      {/* Lightbox with WebGL Viewer */}
      {isLightboxOpen && originalSrc && (
        <div
          className="fixed inset-0 z-50 bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="图片查看器"
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={handleCloseLightbox}
            aria-label="关闭"
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
          <WebGLImageViewer src={originalUrl!} className="h-full w-full" />
        </div>
      )}
    </>
  );
}
