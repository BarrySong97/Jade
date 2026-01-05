import { cn } from "@/lib/utils";

export interface AuthorInfo {
  name: string;
  avatar: string;
  title?: string;
}

export interface AuthorCardProps {
  author: AuthorInfo;
  className?: string;
}

export function AuthorCard({ author, className }: AuthorCardProps) {
  return (
    <div className={cn("space-y-4 mb-4", className)}>
      <div className="flex items-center  gap-2">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-12 h-12 rounded-sm object-cover  ring-2 ring-border"
        />
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
