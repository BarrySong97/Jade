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
    <div
      className={cn(
        "overflow-hidden rounded-sm",
        sizeClasses[size],
        className
      )}
    >
      <img
        src={avatarImage.src}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
