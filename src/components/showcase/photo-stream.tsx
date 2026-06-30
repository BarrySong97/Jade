/**
 * @purpose 摄影展示的复用横向流：照片横向流 + 居中 + 拖拽/滚轮转横向/吸附 + 底部拨盘；列表与详情共用
 * @role    被 photos.astro(列表，dialMode=date) 与 photos/[album].astro(详情，dialMode=index) 以 client island 挂载
 * @deps    react useEffect/useRef；本目录 photography-data(fmtDate、拨盘常量)；@/lib/site(TWITTER 联系方式)；令牌在 showcase.css 的 .photo-page 作用域
 * @gotcha  左右 spacer 按首/末项宽度算，使首项在 scrollLeft=0 即居中（详情封面共享元素转场要求首帧就居中）；封面项带 data-cover，转场命名由 cube-transition.astro 瞬时设置；滚动↔拨盘联动靠命令式 useEffect 改 ref。详见 docs/modules/components/README.md
 */
import { useEffect, useRef } from "react";
import { TWITTER, TWITTER_HANDLE } from "@/lib/site";
import { fmtDate, BASE_H, PEAK, PSPACING, SPREAD } from "./photography-data";

export interface StreamItem {
  ar: number;
  duo: [string, string];
  title?: string; // 标题（列表显示图集名）
  date?: string; // dialMode=date 时拨盘读数用
  href?: string; // 设置后整张图是链接（列表点封面进详情）
  coverSlug?: string; // 共享元素标记：列表封面 / 详情第一张
}

interface Props {
  items: StreamItem[];
  dialMode: "date" | "index";
  title: string;
  backHref: string;
  backLabel: string;
}

const LINK = "transition-colors duration-200 hover:text-[var(--fg)]";
const TRACK =
  "flex flex-1 cursor-grab select-none items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";
const FIG =
  "m-0 flex shrink-0 flex-col items-start [transform-origin:center] transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.93]";

// 让索引 idx 那张在 scrollLeft=0 即落到视口中心:spacer = 50vw - 该项宽度/2
const spacer = (ar: number) => `calc(50vw - min(62vh, 600px) * ${ar} / 2)`;

export default function PhotoStream({ items, dialMode, title, backHref, backLabel }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const teethRefs = useRef<(HTMLDivElement | null)[]>([]);
  const topRef = useRef<HTMLSpanElement>(null);
  const botRef = useRef<HTMLSpanElement>(null);
  const centersRef = useRef<number[]>([]);

  useEffect(() => {
    const track = trackRef.current!;
    const page = pageRef.current!;

    const measure = () => {
      const els = Array.from(track.querySelectorAll<HTMLElement>("[data-photo]"));
      centersRef.current = els.map((el) => el.offsetLeft + el.offsetWidth / 2);
    };

    const setText = (ref: React.RefObject<HTMLSpanElement | null>, v: string) => {
      const el = ref.current;
      if (el && el.dataset.v !== v) {
        el.textContent = v;
        el.dataset.v = v;
      }
    };

    const update = () => {
      const centers = centersRef.current;
      if (!centers.length) return;
      const viewCenter = track.scrollLeft + track.clientWidth / 2;

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

      if (stripRef.current) stripRef.current.style.transform = `translateX(${-f * PSPACING}px)`;

      const teeth = teethRefs.current;
      for (let i = 0; i < teeth.length; i++) {
        const el = teeth[i];
        if (!el) continue;
        const d = Math.abs(i - f);
        const e = d < SPREAD ? 0.5 * (1 + Math.cos((Math.PI * d) / SPREAD)) : 0;
        el.style.height = BASE_H + e * PEAK + "px";
      }

      const idx = Math.round(f);
      if (dialMode === "date") {
        const { y, md } = fmtDate(items[idx].date ?? "");
        setText(topRef, md);
        setText(botRef, y);
      } else {
        setText(topRef, String(idx + 1));
        setText(botRef, `/ ${items.length}`);
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

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    track.addEventListener("wheel", onWheel, { passive: false });

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
    // 拖动过则吞掉 click，避免误触链接
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
  }, [items, dialMode]);

  return (
    <div ref={pageRef} className="relative flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between px-8 py-[22px]">
        <a
          href={backHref}
          className={`${LINK} font-[family-name:var(--mono)] text-[12px] tracking-[0.04em] text-[var(--fg-2)]`}
        >
          {backLabel}
        </a>
        <span className="truncate px-4 font-[family-name:var(--mono)] text-[12px] tracking-[0.34em] text-[var(--fg-2)]">
          {title}
        </span>
        <span className="whitespace-nowrap font-[family-name:var(--mono)] text-[12px] tracking-[0.06em] text-[var(--fg-3)]">
          {items.length} 帧
        </span>
      </header>

      <div ref={trackRef} className={TRACK}>
        <div className="shrink-0" style={{ flexBasis: spacer(items[0].ar) }} />
        {items.map((item, i) => {
          const img = (
            <div
              data-cover={item.coverSlug}
              className="relative h-[62vh] max-h-[600px] overflow-hidden"
              style={{
                aspectRatio: String(item.ar),
                backgroundImage: `linear-gradient(150deg, ${item.duo[0]}, ${item.duo[1]})`,
              }}
            />
          );
          return (
            <figure key={i} data-photo className={FIG}>
              {item.href ? (
                <a href={item.href} className="block">
                  {img}
                </a>
              ) : (
                img
              )}
              {item.title && (
                <figcaption className="mt-4 text-[13.5px] tracking-[0.01em] text-[var(--fg)]">
                  {item.title}
                </figcaption>
              )}
            </figure>
          );
        })}
        <div className="shrink-0" style={{ flexBasis: spacer(items[items.length - 1].ar) }} />
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
            {items.map((_, i) => (
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

        <div className="absolute left-1/2 top-[14px] z-[3] h-[50px] w-[1.5px] -translate-x-1/2 bg-[var(--fg)]" />

        <div className="absolute left-1/2 top-[92px] z-[3] flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
          <span ref={topRef} className="text-[19px] tracking-[0.01em] text-[var(--fg)]" data-v="" />
          <span
            ref={botRef}
            className="font-[family-name:var(--mono)] text-[14px] tracking-[0.08em] text-[var(--fg-3)]"
            data-v=""
          />
        </div>
      </div>

      {/* 左下角联系方式:只展示 Twitter(链接复用首页 PROFILE) */}
      <a
        href={TWITTER.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 left-8 z-[4] flex items-baseline gap-[10px] font-[family-name:var(--mono)] text-[11px] tracking-[0.04em]"
      >
        <span className="text-[var(--fg-3)]">Twitter</span>
        <span className={`${LINK} text-[var(--fg-2)]`}>{TWITTER_HANDLE}</span>
      </a>
    </div>
  );
}
