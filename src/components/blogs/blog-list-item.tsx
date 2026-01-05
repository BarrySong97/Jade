import { useRef, useState } from "react";

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  coverImage?: string;
}

export interface BlogListItemProps {
  post: BlogPost;
}

export function BlogListItem({ post }: BlogListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLAnchorElement>(null);

  const getImagePosition = () => {
    if (!containerRef.current) return {};
    const rect = containerRef.current.getBoundingClientRect();
    // 在容器宽度的 65% 位置显示图片（中间偏右）
    const leftPosition = rect.left + rect.width * 0.65;
    return {
      left: `${leftPosition}px`,
      top: `${rect.top + rect.height / 2}px`,
      transform: "translateY(-50%)",
    };
  };

  return (
    <a
      ref={containerRef}
      href={`/blog/${post.id}`}
      className="group block py-4 pb-3 transition-colors hover:text-foreground border-b"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <time className="shrink-0 text-sm text-muted-foreground">
          {post.date}
        </time>
        <h3 className="flex-1 text-base font-medium text-foreground  transition-colors group-hover:text-foreground">
          {post.title}
        </h3>
      </div>

      {/* Hover Cover Image */}
      {isHovered && post.coverImage && (
        <div
          className="pointer-events-none fixed left-0 z-50"
          style={getImagePosition()}
        >
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-48 w-64 rounded-lg object-cover shadow-xl"
          />
        </div>
      )}
    </a>
  );
}
