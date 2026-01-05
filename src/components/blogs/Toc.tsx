"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

// In Astro's MarkdownHeading: { depth: number; slug: string; text: string; }
export interface HeadingItem {
  depth: number;
  slug: string;
  text: string;
}

export interface TocProps {
  headings: HeadingItem[];
  className?: string;
}

export const Toc = ({ headings, className }: TocProps) => {
  const [activeId, setActiveId] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string>("");
  const [clickedId, setClickedId] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const headingRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // 监听滚动进度
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progress =
        documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始化进度

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 只有在没有点击状态时才更新activeId
        if (clickedId) return;

        // 找出所有正在 intersecting 的标题
        const intersectingEntries = entries.filter(
          (entry) => entry.isIntersecting
        );

        if (intersectingEntries.length > 0) {
          // 选择位置最靠下的标题（boundingClientRect.top 最大的）
          const bottomEntry = intersectingEntries.reduce((prev, current) => {
            return current.boundingClientRect.top > prev.boundingClientRect.top
              ? current
              : prev;
          });

          setActiveId(bottomEntry.target.id);
        }
      },
      { rootMargin: "-100px 0px -66% 0px" }
    );

    // Observe all headings
    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) observer.observe(element);
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.slug);
        if (element) observer.unobserve(element);
      });
    };
  }, [headings, clickedId]);

  // 决定使用哪个ID来更新indicator位置
  const currentId = hoveredId || clickedId || activeId;

  // 当决定显示的ID变化时更新indicator位置
  useEffect(() => {
    updateIndicatorPosition(currentId);
  }, [currentId]);

  const updateIndicatorPosition = (id: string) => {
    if (!id || !indicatorRef.current || !navRef.current) return;

    const headingElement = headingRefs.current.get(id);
    if (!headingElement) return;

    const navRect = navRef.current.getBoundingClientRect();
    const headingRect = headingElement.getBoundingClientRect();

    // Calculate relative position
    const top = headingRect.top - navRect.top;
    const height = headingRect.height;

    // Apply position to indicator
    indicatorRef.current.style.transform = `translateY(${top + 8}px)`;
    indicatorRef.current.style.height = `${Math.max(height - 16, 16)}px`;
    indicatorRef.current.style.opacity = "1";
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();

    // 设置点击的ID
    setClickedId(id);
    setActiveId(id);

    document.querySelector(`#${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // 更新 URL，但不触发新的导航
    window.history.pushState({}, "", `#${id}`);

    // 延迟清除点击状态，以便滚动完成后恢复 IntersectionObserver 的控制
    setTimeout(() => setClickedId(""), 1000);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!headings?.length) return null;

  return (
    <div className={cn("w-64 ", className)}>
      {/* 移除了用户信息部分，因为那些数据源可能不存在，专注于 TOC 功能 */}

      <div className="text-sm font-medium mb-4 relative">
        <div className="font-semibold">目录</div>
      </div>
      <div className="relative pl-3">
        {/* Single indicator that will move */}
        <div
          ref={indicatorRef}
          className="absolute left-0 top-0 w-[3px] bg-primary rounded-full opacity-0 transition-all duration-300"
          style={{
            opacity: currentId ? 1 : 0,
            height: "16px", // 默认高度，会被JS动态更新
          }}
        />
        <nav ref={navRef} className="relative border-l border-muted">
          {headings?.length ? (
            headings.map((heading, index) => {
              const isActive = heading.slug === currentId;
              return (
                <a
                  key={index}
                  ref={(el) => {
                    if (el) headingRefs.current.set(heading.slug, el);
                  }}
                  href={`#${heading.slug}`}
                  onClick={(e) => handleClick(e, heading.slug)}
                  onMouseEnter={() => setHoveredId(heading.slug)}
                  onMouseLeave={() => {
                    setHoveredId("");
                  }}
                  className={cn(
                    "block text-sm transition-colors duration-200 relative py-1.5 pr-4",
                    {
                      "pl-4": heading.depth === 2,
                      "pl-8": heading.depth === 3,
                      "pl-12": heading.depth === 4,
                      "text-foreground font-medium": isActive,
                      "text-muted-foreground hover:text-foreground": !isActive,
                    }
                  )}
                >
                  {heading.text}
                </a>
              );
            })
          ) : (
            <div className="block text-muted-foreground text-sm transition-colors duration-200 relative py-1">
              暂无目录
            </div>
          )}
        </nav>
      </div>

      <div className="h-px bg-border my-4" />

      {/* 阅读进度和回到顶部 */}
      <div className=" flex items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span>{scrollProgress}%</span>
        </div>
        <button
          onClick={scrollToTop}
          className="ml-auto hover:text-foreground transition-colors duration-200"
        >
          回到顶部
        </button>
      </div>
    </div>
  );
};
