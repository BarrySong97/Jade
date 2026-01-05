"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

export interface YearFilterProps {
  years: number[];
  className?: string;
}

export const YearFilter = ({ years, className }: YearFilterProps) => {
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const yearRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());

  // 从 URL 读取当前选中的年份，如果没有则默认选择最新年份
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const yearParam = params.get("year");
    if (yearParam) {
      const year = parseInt(yearParam);
      if (years.includes(year)) {
        setActiveYear(year);
      }
    } else if (years.length > 0) {
      // 默认选择最新年份（第一个，因为已经从大到小排序）
      setActiveYear(years[0]);
    }
  }, [years]);

  // 决定使用哪个年份来更新 indicator 位置
  const currentYear = hoveredYear || activeYear;

  // 当决定显示的年份变化时更新 indicator 位置
  useEffect(() => {
    updateIndicatorPosition(currentYear);
  }, [currentYear]);

  const updateIndicatorPosition = (year: number | null) => {
    if (!year || !indicatorRef.current || !navRef.current) {
      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = "0";
      }
      return;
    }

    const yearElement = yearRefs.current.get(year);
    if (!yearElement) return;

    const navRect = navRef.current.getBoundingClientRect();
    const yearRect = yearElement.getBoundingClientRect();

    // 计算相对位置
    const top = yearRect.top - navRect.top;
    const height = yearRect.height;

    // 应用位置到 indicator
    indicatorRef.current.style.transform = `translateY(${top + 8}px)`;
    indicatorRef.current.style.height = `${Math.max(height - 16, 16)}px`;
    indicatorRef.current.style.opacity = "1";
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    year: number
  ) => {
    e.preventDefault();

    // 更新 URL 参数
    const url = new URL(window.location.href);
    url.searchParams.set("year", year.toString());
    setActiveYear(year);

    // 更新 URL，不刷新页面
    window.history.pushState({}, "", url.toString());

    // 触发自定义事件，让页面知道筛选条件改变了
    window.dispatchEvent(new Event("yearfilterchange"));
  };

  if (!years?.length) return null;

  return (
    <div className={cn("w-64 hidden xl:block", className)}>
      <div className="relative pl-3">
        {/* 移动的指示器 */}
        <div
          ref={indicatorRef}
          className="absolute left-4 top-0 w-[3px] bg-primary rounded-full opacity-0 transition-all duration-300"
          style={{
            opacity: currentYear ? 1 : 0,
            height: "16px",
          }}
        />
        <nav ref={navRef} className="relative border-l border-muted">
          {years.map((year) => {
            const isActive = year === currentYear;
            return (
              <a
                key={year}
                ref={(el) => {
                  if (el) yearRefs.current.set(year, el);
                }}
                href={`?year=${year}`}
                onClick={(e) => handleClick(e, year)}
                onMouseEnter={() => setHoveredYear(year)}
                onMouseLeave={() => {
                  setHoveredYear(null);
                }}
                className={cn(
                  "block text-sm transition-colors duration-200 relative py-1.5 pr-4 pl-3.5",
                  {
                    "text-foreground font-medium": isActive,
                    "text-muted-foreground hover:text-foreground": !isActive,
                  }
                )}
              >
                {year} 年
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
