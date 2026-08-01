/**
 * @purpose 作品集左栏底角:头像 + 右侧 Blog / Twitter 链接(列表与详情共用)
 * @role    被 works.tsx / work-detail.tsx 挂在 aside 底;外层 `data-works-avatar` 供列表↔详情原地 VT
 * @deps    @/components/common/avatar;@/lib/site(PROFILE/TWITTER)
 * @gotcha  Twitter 链接与首页同源(TWITTER.url)。Blog 链回站点首页 `/`。本块整体不进文案横滑转场。
 */

import { Avatar } from "@/components/common/avatar";
import { PROFILE, TWITTER } from "@/lib/site";

const LINK =
  "font-[family-name:var(--mono)] text-[12px] tracking-[0.04em] text-[var(--fg-3)] no-underline transition-colors duration-200 hover:text-[var(--fg)]";

export default function WorksAvatarBar() {
  return (
    <div
      data-works-avatar
      className="mt-auto flex items-end justify-between gap-4 pt-10 max-[880px]:mt-8 max-[880px]:pt-0"
    >
      <Avatar size="lg" alt={PROFILE.name} className="rounded-full" />
      <div className="flex items-baseline gap-[14px]">
        <a href="/" className={LINK}>
          Blog
        </a>
        <a href={TWITTER.url} target="_blank" rel="noopener noreferrer" className={LINK}>
          Twitter
        </a>
      </div>
    </div>
  );
}
