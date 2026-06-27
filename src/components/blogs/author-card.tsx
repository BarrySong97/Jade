/**
 * @purpose 展示文章作者信息的小卡片:头像 + 姓名 + 可选头衔
 * @role    纯展示组件,被 Toc/MobileToc 等目录组件嵌入;同时导出 AuthorInfo 类型供其复用
 * @deps    @/components/common/avatar、@/lib/utils
 * @gotcha  无内部状态的纯函数组件;title 缺省时不渲染;详见 docs/modules/components/README.md
 */

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/avatar";

export interface AuthorInfo {
  name: string;
  title?: string;
}

export interface AuthorCardProps {
  author: AuthorInfo;
  className?: string;
}

export function AuthorCard({ author, className }: AuthorCardProps) {
  return (
    <div className={cn("space-y-4 mb-4", className)}>
      <div className="flex items-center gap-2">
        <Avatar size="md" className="ring-2 ring-border" alt={author.name} />
        <div className="flex flex-col gap-1 items-start">
          <h3 className="font-medium text-base">{author.name}</h3>
          {author.title && <p className="text-xs text-muted-foreground mt-1">{author.title}</p>}
        </div>
      </div>
    </div>
  );
}
