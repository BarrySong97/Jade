/**
 * @purpose /products 作品集页的根组件（浅色单主题），左侧固定简介 + 右侧持续流动的瀑布流;鼠标 hover 进瀑布流即「就地暂停 + 可滚动」,带自定义滚动条
 * @role    products.astro 直接挂载;客户端岛(paused 状态 + 列/滚动/滑块 ref)
 * @deps    react(useRef/useState)、本目录 works-data(WORKS)、works-intro、work-card、@/lib/utils(cn)
 * @gotcha  每列内容复制一份做无缝循环(translateY -50%↔0)。动画 class(works-flow-*)**始终挂着**,暂停/恢复只用内联 animationName 覆盖(none/空)来切——**不要**改成按 paused 切 class,否则恢复时有一帧 class 缺席、整列跳到顶 → 抖动。**hover 暂停**:读各列当前 translateY 转 margin-top 就地冻结(margin 参与布局可滚动,transform 会留空白),scroller 改 overflow-y:auto。**离开恢复**:把 margin 冻结量与当前 scrollTop 合并((m-s)%S)算出进度,给负 animation-delay 续播(不跳)。**滚动条**:原生隐藏(0 宽不挤布局),自定义 thumb 覆盖右侧、仅暂停时显示(原生 overlay 条会淡出,不满足常驻)。50s 须与 showcase.css 一致。详见 docs/modules/components/README.md
 */

import { useRef, useState } from "react";
import { WORKS } from "./works-data";
import WorksIntro from "./works-intro";
import WorkCard from "./work-card";
import { cn } from "@/lib/utils";

const COLS = 2;
const DURATION = 50; // s,与 showcase.css 的动画时长一致
const COLUMNS = Array.from({ length: COLS }, (_, c) => WORKS.filter((_, i) => i % COLS === c));

export default function Works() {
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverRef = useRef(false);
  const dragRef = useRef<{ startY: number; startTop: number } | null>(null);

  // 自定义滚动条滑块:按 scroller 滚动量摆放
  const updateThumb = () => {
    const sc = scrollRef.current;
    const th = thumbRef.current;
    if (!sc || !th) return;
    const { clientHeight: ch, scrollHeight: sh, scrollTop: st } = sc;
    if (sh <= ch + 1) {
      th.style.height = "0px";
      return;
    }
    const trackH = th.parentElement?.clientHeight ?? ch; // 轨道(带内缩)实际高度
    const thumbH = Math.max(32, (ch / sh) * trackH);
    const top = (st / (sh - ch)) * (trackH - thumbH);
    th.style.height = `${thumbH}px`;
    th.style.transform = `translateY(${top}px)`;
  };

  const pause = () => {
    if (paused) return;
    for (const el of colRefs.current) {
      if (!el) continue;
      const ty = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42; // 当前位移(负)
      el.style.animationName = "none";
      el.style.marginTop = `${ty}px`;
    }
    setPaused(true);
    requestAnimationFrame(updateThumb);
  };

  const resume = () => {
    if (!paused) return;
    const s = scrollRef.current?.scrollTop ?? 0;
    for (let ci = 0; ci < colRefs.current.length; ci++) {
      const el = colRefs.current[ci];
      if (!el) continue;
      const m = parseFloat(el.style.marginTop) || 0;
      const S = el.scrollHeight / 2 || 1; // 一组(单份)高度
      const ty = (m - s) % S; // 合并冻结量 + 滚动偏移,归一到一组内(无缝),∈(-S,0]
      const t = Math.min(1, Math.max(0, ci % 2 === 0 ? 1 + ty / S : -ty / S));
      el.style.marginTop = "";
      el.style.animationName = "";
      el.style.animationDelay = `${-t * DURATION}s`;
    }
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setPaused(false);
  };

  const onEnter = () => {
    hoverRef.current = true;
    pause();
  };
  const onLeave = () => {
    hoverRef.current = false;
    if (!dragRef.current) resume(); // 拖拽中不恢复,松手后再判断
  };

  // 自定义滑块拖拽
  const onThumbDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const sc = scrollRef.current;
    if (!sc) return;
    dragRef.current = { startY: e.clientY, startTop: sc.scrollTop };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onThumbMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const sc = scrollRef.current;
    const th = thumbRef.current;
    if (!d || !sc || !th) return;
    const trackH = th.parentElement?.clientHeight ?? sc.clientHeight;
    const range = trackH - th.offsetHeight;
    if (range <= 0) return;
    sc.scrollTop =
      d.startTop + ((e.clientY - d.startY) / range) * (sc.scrollHeight - sc.clientHeight);
  };
  const onThumbUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!hoverRef.current) resume(); // 拖到区域外松手 → 恢复流动
  };

  return (
    <div className="works-page grid min-h-screen grid-cols-[minmax(300px,38%)_1fr] items-start bg-[var(--bg)] text-[var(--fg)] max-[880px]:grid-cols-[1fr]">
      <aside className="sticky top-0 flex h-screen self-start border-r border-[var(--line)] max-[880px]:static max-[880px]:h-auto max-[880px]:border-r-0 max-[880px]:border-b">
        <WorksIntro />
      </aside>

      <main className="relative h-screen" onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {/* 实际滚动容器:原生滚动条隐藏(0 宽,不挤布局),hover 时可滚 */}
        <div
          ref={scrollRef}
          onScroll={updateThumb}
          className={cn(
            "h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            paused ? "overflow-y-auto" : "overflow-hidden",
          )}
        >
          <div className="flex min-h-full gap-3 p-[clamp(24px,3vw,44px)]">
            {COLUMNS.map((col, ci) => (
              <div key={ci} className="min-w-0 flex-1">
                <div
                  ref={(el) => {
                    colRefs.current[ci] = el;
                  }}
                  // class 始终挂着,暂停/恢复只用内联 animationName 覆盖控制(避免恢复时 class 缺席一帧而抖动)
                  className={ci % 2 === 0 ? "works-flow-down" : "works-flow-up"}
                >
                  {[...col, ...col].map((w, i) => (
                    <WorkCard key={i} work={w} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 自定义滚动条:不占宽度,仅暂停(hover)时显示 */}
        <div
          className={cn(
            "absolute inset-y-2 right-1.5 z-20 w-1.5 transition-opacity duration-200",
            paused ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <div
            ref={thumbRef}
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            style={{ height: 0 }}
            className="w-full cursor-grab rounded-full bg-[var(--fg-3)]/55 transition-colors hover:bg-[var(--fg-2)] active:cursor-grabbing"
          />
        </div>
      </main>
    </div>
  );
}
