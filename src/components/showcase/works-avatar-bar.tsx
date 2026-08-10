/**
 * @purpose 作品集左栏底角:头像 + 右侧 Blog / Twitter 链接(列表与详情共用)
 * @role    被 works.tsx / work-detail.tsx 挂在 aside 底;外层 `data-works-avatar` 供列表↔详情原地 VT
 * @deps    @/assets/info/profile-portrait-avatar.webp;@/lib/site(PROFILE/TWITTER)
 * @gotcha  手绘肖像约为首页尺寸的 81%，不加圆形头像容器；用负平移抵消图片内部透明留白，使人物轮廓与上方文字对齐。使用 424px WebP 衍生资源避免下载原始 PNG。Twitter 链接与首页同源(TWITTER.url)。Blog 链回站点首页 `/`。本块整体不进文案横滑转场。
 */

import profilePortrait from "@/assets/info/profile-portrait-avatar.webp";
import { PROFILE, TWITTER } from "@/lib/site";

const LINK =
  "font-[family-name:var(--mono)] text-[12px] tracking-[0.04em] text-[var(--fg-3)] no-underline transition-colors duration-200 hover:text-[var(--fg)]";

export default function WorksAvatarBar() {
  return (
    <div
      data-works-avatar
      className="mt-auto flex items-end justify-between gap-4 pt-10 max-[880px]:mt-8 max-[880px]:pt-0"
    >
      <img
        src={profilePortrait.src}
        alt={`${PROFILE.name} 的手绘肖像`}
        className="h-auto w-[154px] -translate-x-[22px] min-[881px]:w-[172px] min-[881px]:-translate-x-[25px]"
      />
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
