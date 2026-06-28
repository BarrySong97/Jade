/**
 * @purpose /products 作品集页的根组件（浅色单主题），渲染左侧固定简介 + 右侧瀑布流作品网格
 * @role    products.astro 直接挂载;纯展示,无状态
 * @deps    本目录 works-data(WORKS)、works-intro、work-card
 * @gotcha  .works-page 作用域提供浅色令牌/字体(src/styles/showcase.css);整页 min-h-screen、body 滚动;首页↔本页的立方体转场见 cube-transition.astro / global.css。详见 docs/modules/components/README.md
 */

import { WORKS } from "./works-data";
import WorksIntro from "./works-intro";
import WorkCard from "./work-card";

export default function Works() {
  return (
    <div className="works-page grid min-h-screen grid-cols-[minmax(300px,38%)_1fr] items-start bg-[var(--bg)] text-[var(--fg)] max-[880px]:grid-cols-[1fr]">
      <aside className="sticky top-0 flex h-screen self-start border-r border-[var(--line)] max-[880px]:static max-[880px]:h-auto max-[880px]:border-r-0 max-[880px]:border-b">
        <WorksIntro />
      </aside>

      <main className="p-[clamp(24px,3vw,44px)]">
        <div className="columns-2 [column-gap:12px] lg:columns-3">
          {WORKS.map((w, i) => (
            <WorkCard key={i} work={w} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
