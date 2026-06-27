/**
 * @purpose 站点顶部导航，sticky 吸顶并渲染返回首页链接（含 accent 圆点与 /handle 标识）
 * @role    布局组件，由各页面/Layout 引入置于顶部；纯静态服务端渲染，无主题切换等交互
 * @deps    @/lib/site 的 PROFILE 站点信息常量
 * @gotcha  async 组件但无异步逻辑；样式依赖 global.css 的 --bg/--accent/--ink-4 等 CSS 变量；约定见 docs/modules/components/README.md
 */

import { PROFILE } from "@/lib/site";

export interface HeaderProps {
  className?: string;
}

export default async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg)]/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-[720px] items-center px-6">
        <a href="/" className="flex items-center gap-[9px] text-[15.5px]" aria-label="返回首页">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[var(--accent)]" />
          <span className="font-mono text-[14px] text-[var(--ink-4)]">/{PROFILE.handle}</span>
        </a>
      </div>
    </header>
  );
}
