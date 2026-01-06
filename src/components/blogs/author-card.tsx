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
          {author.title && (
            <p className="text-xs text-muted-foreground mt-1">{author.title}</p>
          )}
        </div>
      </div>
    </div>
  );
}
