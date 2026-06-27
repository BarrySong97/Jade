/**
 * @purpose 桌面端侧边栏目录(TOC):带激活指示条、阅读进度百分比和回到顶部
 * @role    博客文章页桌面侧栏的目录组件,由文章布局以 React island 挂载,接收 Astro 提取的 headings
 * @deps    react hooks、IntersectionObserver、@/lib/utils;依赖页面标题元素的 id 与 slug 对应
 * @gotcha  无标题时返回 null;点击后 1s 内暂停 observer 防止高亮抖动;详见 docs/modules/components/README.md
 */

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
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progress = documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
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
        const intersectingEntries = entries.filter((entry) => entry.isIntersecting);

        if (intersectingEntries.length > 0) {
          // 选择位置最靠下的标题（boundingClientRect.top 最大的）
          const bottomEntry = intersectingEntries.reduce((prev, current) => {
            return current.boundingClientRect.top > prev.boundingClientRect.top ? current : prev;
          });

          setActiveId(bottomEntry.target.id);
        }
      },
      { rootMargin: "-100px 0px -66% 0px" },
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
    <div className={cn("flex min-h-0 w-[200px] flex-1 flex-col", className)}>
      <div className="shrink-0 font-mono text-[11.5px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        目录
      </div>
      {/* 中间列表区:仅这里滚动(指示条也在内,随之对齐);隐藏滚动条 */}
      <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 跟随激活项移动的指示条 */}
        <div
          ref={indicatorRef}
          className="absolute left-0 top-0 z-10 w-[2px] bg-[var(--accent)] opacity-0 transition-all duration-300"
          style={{
            opacity: currentId ? 1 : 0,
            height: "16px",
          }}
        />
        <nav ref={navRef} className="relative flex flex-col border-l border-[var(--line)]">
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
                    "toc-item block py-1.5 pr-2 text-[13px] leading-[1.45] transition-colors duration-200",
                    {
                      "pl-[14px]": heading.depth <= 2,
                      "pl-[26px]": heading.depth === 3,
                      "pl-[38px]": heading.depth >= 4,
                      "text-[var(--accent-ink)] font-medium": isActive,
                      "text-[var(--ink-3)]": !isActive,
                    },
                  )}
                >
                  {heading.text}
                </a>
              );
            })
          ) : (
            <div className="py-1 pl-[14px] text-[13px] text-[var(--ink-3)]">暂无目录</div>
          )}
        </nav>
      </div>

      <div className="my-4 h-px shrink-0 bg-[var(--line)]" />

      {/* 阅读进度和回到顶部(固定在底部) */}
      <div className="flex shrink-0 items-center font-mono text-[11.5px] text-[var(--ink-3)]">
        <span>{scrollProgress}%</span>
        <button
          onClick={scrollToTop}
          className="ml-auto transition-colors duration-200 hover:text-[var(--accent-ink)]"
        >
          回到顶部
        </button>
      </div>
    </div>
  );
};
