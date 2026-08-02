/**
 * @purpose 作品集页左栏(sticky)的纯展示组件：姓名 + 几段灰色自述
 * @role    被 works.tsx 渲染于 <aside> 内;无状态,文案读 INTRO、姓名读 PROFILE
 * @deps    本目录 works-data(INTRO/worksLatestYear)、@/lib/site(PROFILE)
 * @gotcha  姓名对齐首页大标题(`clamp(26px,3.6vw,36px)`/`font-semibold`),取 PROFILE.name 与首页同源;自述对齐首页简介(`15px`/`leading-[1.7]`),通篇 `--fg-2`。年份行结束年取 WORKS 最新 `y`,勿写死。令牌见 src/styles/showcase.css
 */

import { INTRO, worksLatestYear } from "./works-data";
import { PROFILE } from "@/lib/site";

export default function WorksIntro() {
  const yearLine = `${INTRO.yearFrom} — ${worksLatestYear()} 的部分作品`;

  return (
    <div className="works-rise">
      <div className="m-0 text-[clamp(26px,3.6vw,36px)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--fg)]">
        {PROFILE.name}
      </div>

      <div className="mt-[clamp(24px,4vh,42px)] flex max-w-[34em] flex-col gap-[1.5em] text-[15px] leading-[1.7] text-[var(--fg-2)]">
        {INTRO.paras.map((p) => (
          <p key={p} className="m-0 [text-wrap:pretty]">
            {p}
          </p>
        ))}
        <p className="m-0 [text-wrap:pretty]">{yearLine}</p>
      </div>
    </div>
  );
}
