/**
 * @purpose 把 thumbhash(base64)解码成占位样式:平均色 + 模糊图 dataURL。
 * @role    供 .astro 组件在构建期算好内联(零 JS、首帧即有占位);React 侧的 blog-image.tsx 自己在 useMemo 里做同样的事。
 * @deps    thumbhash(thumbHashToDataURL / thumbHashToAverageRGBA)
 * @gotcha  解码失败一律返回 null(缺 thumbhash 的外链很常见),调用方退回纯色底;这是纯函数,不要在这里做取图或缓存。
 */
import { thumbHashToDataURL, thumbHashToAverageRGBA } from "thumbhash";

export interface ThumbPlaceholder {
  /** 平均色,瞬时可绘制(无需解码),免首帧白屏 */
  avg: string;
  /** 模糊图 dataURL,盖在平均色之上 */
  url: string;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function thumbhashPlaceholder(thumbhash?: string | null): ThumbPlaceholder | null {
  if (!thumbhash) return null;
  try {
    const bytes = base64ToBytes(thumbhash);
    const { r, g, b, a } = thumbHashToAverageRGBA(bytes);
    const avg = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    return { avg, url: thumbHashToDataURL(bytes) };
  } catch {
    return null;
  }
}
