/**
 * @purpose 作品集页左侧固定栏的纯展示组件：姓名标题、中文副题、简介段落、联系方式与返回博客链接
 * @role    被 works.tsx 渲染于 <aside> 内；无状态，数据全部读自 works-data 的 INTRO
 * @deps    本目录 works-data(INTRO)
 * @gotcha  下划线动效(LINK)/小标签(KICKER)用 Tailwind 任意值内联，字体须用 font-[family-name:var(--serif)]/var(--mono) 写法；令牌见 src/styles/showcase.css，参 docs/modules/components/README.md
 */

import { INTRO } from "./works-data";

/* 链接下划线动效（原 .works-link，改用 Tailwind 任意值实现） */
const LINK =
  "bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat [background-size:0%_1px] [background-position:0_100%] pb-px transition-[background-size] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:[background-size:100%_1px]";

/* 小标签（原 .kicker） */
const KICKER =
  "font-[family-name:var(--mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--fg-3)]";

/* 作品页左侧固定文字 */
export default function WorksIntro() {
  return (
    <div className="flex h-full w-full flex-col justify-between p-[clamp(32px,5vw,64px)]">
      <div>
        <div className={`${KICKER} mb-[18px]`}>{INTRO.years}</div>
        <h1 className="m-0 font-[family-name:var(--serif)] text-[clamp(34px,4.2vw,56px)] font-normal leading-[1.02] tracking-[-0.02em]">
          {INTRO.name}
        </h1>
        <div className="mt-2 font-[family-name:var(--serif)] text-[clamp(16px,1.6vw,20px)] italic text-[var(--fg-2)]">
          {INTRO.zh}
        </div>
        <p className="mt-[clamp(24px,3vw,36px)] max-w-[38ch] text-[14.5px] leading-[1.75] text-[var(--fg-2)]">
          {INTRO.para}
        </p>
      </div>

      <div className="mt-10">
        <div className={`${KICKER} mb-[14px]`}>Contact</div>
        <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
          {INTRO.contact.map((c) => (
            <li key={c.label} className="flex items-baseline gap-[14px]">
              <span className="w-[78px] shrink-0 font-[family-name:var(--mono)] text-[11px] tracking-[0.04em] text-[var(--fg-3)]">
                {c.label}
              </span>
              <a href={c.url} className={`${LINK} text-[14px] text-[var(--fg)]`}>
                {c.value}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/"
          className={`${LINK} mt-7 inline-block font-[family-name:var(--mono)] text-[12px] tracking-[0.04em] text-[var(--fg-3)]`}
        >
          ← 回到博客
        </a>
      </div>
    </div>
  );
}
