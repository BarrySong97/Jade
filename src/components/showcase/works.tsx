/**
 * @purpose /products 作品集页的根 React 岛，渲染左侧固定简介 + 右侧瀑布流作品网格 + 主题切换器
 * @role    页面入口组件（被 products.astro 以 client island 挂载）；持有 theme 状态并向下分发给 WorksIntro / WorkCard / ThemeSwitch
 * @deps    react useState；本目录 works-data(WORKS)、works-intro、work-card、theme-switch
 * @gotcha  data-theme 属性 + .works-page 作用域驱动主题色，样式令牌/字体在 src/styles/showcase.css 提供；详见 docs/modules/components/README.md
 */

import { useState } from "react";
import { WORKS, type Theme } from "./works-data";
import WorksIntro from "./works-intro";
import WorkCard from "./work-card";
import ThemeSwitch from "./theme-switch";

export default function Works() {
  const [theme, setTheme] = useState<Theme>("dark");

  return (
    <div
      data-theme={theme}
      className="works-page grid min-h-screen grid-cols-[minmax(300px,38%)_1fr] items-start bg-[var(--bg)] text-[var(--fg)] max-[880px]:grid-cols-[1fr]"
    >
      <aside className="sticky top-0 flex h-screen self-start border-r border-[var(--line)] max-[880px]:static max-[880px]:h-auto max-[880px]:border-r-0 max-[880px]:border-b">
        <WorksIntro />
      </aside>

      <main className="p-[clamp(24px,3vw,44px)]">
        <div className="columns-2 [column-gap:12px] lg:columns-3">
          {WORKS.map((w, i) => (
            <WorkCard key={i} work={w} theme={theme} index={i} />
          ))}
        </div>
      </main>

      <ThemeSwitch theme={theme} onChange={setTheme} />
    </div>
  );
}
