/**
 * @purpose /products 作品集页的根组件（浅色单主题）：左栏 sticky 简介 + 底角头像栏 + 右侧两列作品条目,整页普通纵向滚动
 * @role    products.astro 直接挂载;纯布局无状态(仍需 client:load —— 子组件 BlogImage 的 blur-up/Motion 要 hydration)
 * @deps    本目录 works-data(WORKS/workCover)、works-intro、work-card、works-avatar-bar
 * @gotcha  分列用「按图片比例贪心装箱」而不是 i % COLS——grove 是 9:16 长图。文案块 `data-works-aside` 供列表↔详情横滑转场;头像栏 `data-works-avatar` 单独挂名、不参与文案动画。窄屏取消 min-h-screen。ADR 0004:勿加回自动滚动瀑布流。
 */

import { WORKS, workCover } from "./works-data";
import WorksIntro from "./works-intro";
import WorkCard from "./work-card";
import WorksAvatarBar from "./works-avatar-bar";

const COLS = 2;
/* 每条的相对高度 ≈ 封面纵横比 + 头部/说明/间距的固定开销(以列宽为 1) */
const COST = 0.4;

/* 保持数据顺序,逐条丢进当前最矮的一列(贪心装箱) */
const COLUMNS = (() => {
  const cols: { work: (typeof WORKS)[number]; index: number }[][] = Array.from(
    { length: COLS },
    () => [],
  );
  const heights = Array.from({ length: COLS }, () => 0);
  WORKS.forEach((work, index) => {
    const cover = workCover(work);
    const c = heights.indexOf(Math.min(...heights));
    cols[c].push({ work, index });
    heights[c] += cover.height / cover.width + COST;
  });
  return cols;
})();

export default function Works() {
  return (
    <div className="works-page grid min-h-screen grid-cols-[minmax(280px,30%)_1fr] items-start bg-[var(--bg)] text-[15px] leading-[1.62] tracking-[-0.006em] text-[var(--fg)] max-[880px]:grid-cols-[1fr]">
      <aside className="sticky top-0 flex min-h-screen flex-col self-start px-[clamp(28px,3.4vw,60px)] pt-[clamp(30px,4.4vh,56px)] pr-[clamp(32px,3.6vw,66px)] pb-[clamp(28px,3.4vw,60px)] max-[880px]:static max-[880px]:mb-[34px] max-[880px]:min-h-0 max-[880px]:border-b max-[880px]:border-[var(--line)] max-[880px]:pb-[34px]">
        <div data-works-aside className="min-h-0 flex-1 overflow-hidden">
          <WorksIntro />
        </div>
        <WorksAvatarBar />
      </aside>

      <div className="flex items-start gap-[clamp(32px,3.6vw,66px)] pt-[clamp(30px,4.4vh,56px)] pr-[clamp(28px,3.4vw,60px)] pb-[22vh] max-[1180px]:flex-col max-[1180px]:gap-[clamp(46px,5vw,78px)] max-[880px]:px-[clamp(28px,3.4vw,60px)] max-[880px]:pt-0 max-[880px]:pb-[18vh]">
        {COLUMNS.map((col, ci) => (
          <div
            key={ci}
            className="flex min-w-0 flex-1 flex-col gap-[clamp(46px,5vw,78px)] max-[1180px]:w-full"
          >
            {col.map(({ work, index }) => (
              <WorkCard key={work.slug} work={work} index={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
