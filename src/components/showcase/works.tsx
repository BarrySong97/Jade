/**
 * @purpose /products 作品集页的根组件（浅色单主题），渲染左侧固定简介 + 右侧持续流动的瀑布流
 * @role    products.astro 直接挂载;纯展示,无状态
 * @deps    本目录 works-data(WORKS)、works-intro、work-card
 * @gotcha  瀑布流每列内容复制一份做无缝循环(translateY -50%↔0);奇数列向下、偶数列向上;hover 整列容器(group)暂停;令牌见 src/styles/showcase.css。详见 docs/modules/components/README.md
 */

import { WORKS } from "./works-data";
import WorksIntro from "./works-intro";
import WorkCard from "./work-card";

const COLS = 3;
// 轮转分配到各列,保留原始序号(用于角标)
const COLUMNS = Array.from({ length: COLS }, (_, c) =>
  WORKS.map((w, i) => ({ w, i })).filter((_, i) => i % COLS === c),
);

export default function Works() {
  return (
    <div className="works-page grid min-h-screen grid-cols-[minmax(300px,38%)_1fr] items-start bg-[var(--bg)] text-[var(--fg)] max-[880px]:grid-cols-[1fr]">
      <aside className="sticky top-0 flex h-screen self-start border-r border-[var(--line)] max-[880px]:static max-[880px]:h-auto max-[880px]:border-r-0 max-[880px]:border-b">
        <WorksIntro />
      </aside>

      <main className="h-screen overflow-hidden p-[clamp(24px,3vw,44px)]">
        {/* group:hover 整个瀑布流时暂停所有列 */}
        <div className="group flex h-full gap-3">
          {COLUMNS.map((col, ci) => (
            <div key={ci} className="min-w-0 flex-1">
              <div className={ci % 2 === 0 ? "works-flow-down" : "works-flow-up"}>
                {[...col, ...col].map((it, i) => (
                  <WorkCard key={i} work={it.w} index={it.i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
