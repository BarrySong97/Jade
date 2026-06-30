/**
 * @purpose 站点页脚，展示版权行（姓名/头衔/地点）与"用克制构建"标语
 * @role    布局组件，由各页面/Layout 引入置于底部；纯静态服务端渲染，无交互
 * @deps    @/lib/site 的 PROFILE 站点信息常量
 * @gotcha  async 组件但无异步逻辑，版权年份"2026"为硬编码；布局组件约定见 docs/modules/components/README.md
 */

import { PROFILE } from "@/lib/site";

export interface FooterProps {
  className?: string;
}

export default async function Footer() {
  return (
    <footer className="mt-[104px]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-1 px-6 pb-8 pt-6 sm:flex-row sm:justify-between">
        <span className="font-mono text-[11.5px] text-[var(--ink-4)]">
          © 2026 {PROFILE.name} · {PROFILE.location}
        </span>
        <span className="font-mono text-[11.5px] text-[var(--ink-4)]">
          用克制构建
        </span>
      </div>
    </footer>
  );
}
