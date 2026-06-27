/**
 * @purpose 渲染站点固定头像，提供 sm/md/lg 三档尺寸的圆角方形头像组件
 * @role    通用展示组件，被作者卡片、Header/Footer 等需要头像处复用；自身仅渲染静态 img
 * @deps    @/lib/utils 的 cn()；构建期导入的本地资源 @/assets/info/avatar.webp
 * @gotcha  头像图片写死为本地资源，无法外部传入 src；其它通用组件约定见 docs/modules/components/README.md
 */

import { cn } from "@/lib/utils";
import avatarImage from "@/assets/info/avatar.webp";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  size?: AvatarSize;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function Avatar({ size = "md", className, alt = "avatar" }: AvatarProps) {
  return (
    <div className={cn("overflow-hidden rounded-sm", sizeClasses[size], className)}>
      <img src={avatarImage.src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}
