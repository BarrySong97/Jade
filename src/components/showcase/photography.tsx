/**
 * @purpose /photos 摄影页根岛：横向照片流 + 底部拨盘式时间轴，滚动/拖拽时拨盘刻度起伏并显示中心日期
 * @role    页面入口组件（被 photos.astro 以 client island 挂载）；自管交互，无对外 props
 * @deps    react useEffect/useRef；本目录 photography-data(PHOTOS、fmtDate、BASE_H/PEAK/PSPACING/SPREAD)
 * @gotcha  滚动↔拨盘联动靠命令式 useEffect 直接改多个 ref 的 style（绕过 React 渲染）；滚轮纵向转横向 + 松手吸附；令牌/字体在 src/styles/showcase.css 的 .photo-page 作用域，字体用 font-[family-name:var(--mono)]，参 docs/modules/components/README.md
 */

import { useEffect, useRef } from "react";
import { PHOTOS, fmtDate, BASE_H, PEAK, PSPACING, SPREAD } from "./photography-data";

/* 顶部链接 hover（原 .ph-link） */
const LINK = "transition-colors duration-200 hover:text-[var(--fg)]";

/* 隐藏横向滚动条（原 .photo-track） */
const TRACK =
  "flex flex-1 cursor-grab select-none items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/* hover 时整张图（含标题）向内缩小（原 .ph-fig） */
const FIG =
  "m-0 flex shrink-0 flex-col items-start [transform-origin:center] transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.93]";

export default function Photography() {
  const pageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const teethRefs = useRef<(HTMLDivElement | null)[]>([]);
  const yearRef = useRef<HTMLSpanElement>(null);
  const mdRef = useRef<HTMLSpanElement>(null);
  const centersRef = useRef<number[]>([]);

  useEffect(() => {
    const track = trackRef.current!;
    const page = pageRef.current!;

    const measure = () => {
      const items = Array.from(track.querySelectorAll<HTMLElement>("[data-photo]"));
      centersRef.current = items.map((el) => el.offsetLeft + el.offsetWidth / 2);
    };

    const update = () => {
      const centers = centersRef.current;
      if (!centers.length) return;
      const viewCenter = track.scrollLeft + track.clientWidth / 2;

      // 连续索引 f
      let f = 0;
      if (viewCenter <= centers[0]) f = 0;
      else if (viewCenter >= centers[centers.length - 1]) f = centers.length - 1;
      else {
        for (let i = 0; i < centers.length - 1; i++) {
          if (viewCenter >= centers[i] && viewCenter < centers[i + 1]) {
            f = i + (viewCenter - centers[i]) / (centers[i + 1] - centers[i]);
            break;
          }
        }
      }

      // 刻度整体平移：当前照片那根线对准中心指针
      const tx = -f * PSPACING;
      if (stripRef.current) stripRef.current.style.transform = `translateX(${tx}px)`;

      // 每张照片一根线；越靠中心越高，向两侧圆润降低
      const teeth = teethRefs.current;
      for (let i = 0; i < teeth.length; i++) {
        const el = teeth[i];
        if (!el) continue;
        const d = Math.abs(i - f);
        const e = d < SPREAD ? 0.5 * (1 + Math.cos((Math.PI * d) / SPREAD)) : 0;
        el.style.height = BASE_H + e * PEAK + "px";
      }

      // 中心日期
      const { y, md } = fmtDate(PHOTOS[Math.round(f)].date);
      if (yearRef.current && yearRef.current.dataset.v !== y) {
        yearRef.current.textContent = y;
        yearRef.current.dataset.v = y;
      }
      if (mdRef.current && mdRef.current.dataset.v !== md) {
        mdRef.current.textContent = md;
        mdRef.current.dataset.v = md;
      }
    };

    measure();
    if (centersRef.current.length) track.scrollLeft = centersRef.current[0] - track.clientWidth / 2;
    update();

    let dragging = false,
      snapTimer = 0,
      isSnapping = false;

    const nearestTarget = () => {
      const centers = centersRef.current;
      const vc = track.scrollLeft + track.clientWidth / 2;
      let best = 0,
        bd = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const d = Math.abs(centers[i] - vc);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return centers[best] - track.clientWidth / 2;
    };
    const settle = () => {
      isSnapping = true;
      track.scrollTo({ left: nearestTarget(), behavior: "smooth" });
      window.setTimeout(() => {
        isSnapping = false;
      }, 480);
    };
    const scheduleSettle = () => {
      if (dragging || isSnapping) return;
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(settle, 130);
    };

    const onScroll = () => {
      update();
      scheduleSettle();
    };
    track.addEventListener("scroll", onScroll, { passive: true });

    // 滚轮纵向 → 横向
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    track.addEventListener("wheel", onWheel, { passive: false });

    // 鼠标拖动 —— 自由滑动，松手吸附到最近
    let startX = 0,
      startSL = 0,
      moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      isSnapping = false;
      clearTimeout(snapTimer);
      startX = e.clientX;
      startSL = track.scrollLeft;
      page.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      track.scrollLeft = startSL - dx;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      page.style.cursor = "";
      settle();
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    page.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    page.addEventListener("click", onClickCapture, true);

    const onResize = () => {
      measure();
      update();
    };
    window.addEventListener("resize", onResize);

    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("wheel", onWheel);
      page.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      page.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={pageRef} className="relative flex h-full flex-col">
      {/* 顶部细标题 */}
      <header className="flex shrink-0 items-center justify-between px-8 py-[22px]">
        <a
          href="/"
          className={`${LINK} font-[family-name:var(--mono)] text-[12px] tracking-[0.04em] text-[var(--fg-2)]`}
        >
          ← 回到博客
        </a>
        <span className="font-[family-name:var(--mono)] text-[12px] tracking-[0.34em] text-[var(--fg-2)]">
          PHOTOGRAPHS
        </span>
        <span className="font-[family-name:var(--mono)] text-[12px] tracking-[0.06em] text-[var(--fg-3)]">
          {PHOTOS.length} 帧
        </span>
      </header>

      {/* 横向照片流（垂直居中、首尾相连） */}
      <div ref={trackRef} className={TRACK}>
        <div className="shrink-0 basis-[calc(50vw-200px)]" />
        {PHOTOS.map((p, i) => (
          <figure key={i} data-photo className={FIG}>
            <div
              className="relative h-[62vh] max-h-[600px] overflow-hidden"
              style={{
                aspectRatio: String(p.ar),
                backgroundImage: `linear-gradient(150deg, ${p.duo[0]}, ${p.duo[1]})`,
              }}
            />
            <figcaption className="mt-4 text-[13.5px] tracking-[0.01em] text-[var(--fg)]">
              {p.title}
            </figcaption>
          </figure>
        ))}
        <div className="shrink-0 basis-[calc(50vw-200px)]" />
      </div>

      {/* 拨盘时间轴 */}
      <div className="relative h-[168px] shrink-0">
        <div
          className="absolute left-0 right-0 top-[30px] h-[46px] overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
          }}
        >
          <div ref={stripRef} className="absolute inset-x-0 top-0 h-full will-change-transform">
            {PHOTOS.map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  teethRefs.current[i] = el;
                }}
                className="absolute bottom-0 w-px -translate-x-1/2 bg-[var(--fg)] opacity-[0.28]"
                style={{ left: `calc(50% + ${i * PSPACING}px)`, height: 10 }}
              />
            ))}
          </div>
        </div>

        {/* 固定居中指针 */}
        <div className="absolute left-1/2 top-[14px] z-[3] h-[50px] w-[1.5px] -translate-x-1/2 bg-[var(--fg)]" />

        {/* 中心日期 */}
        <div className="absolute left-1/2 top-[92px] z-[3] flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
          <span ref={mdRef} className="text-[19px] tracking-[0.01em] text-[var(--fg)]" data-v="">
            May 12
          </span>
          <span
            ref={yearRef}
            className="font-[family-name:var(--mono)] text-[14px] tracking-[0.08em] text-[var(--fg-3)]"
            data-v=""
          >
            2026
          </span>
        </div>
      </div>
    </div>
  );
}
