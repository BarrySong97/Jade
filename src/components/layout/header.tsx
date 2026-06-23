import { PROFILE } from "@/lib/site";

export interface HeaderProps {
  className?: string;
}

export default async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg)]/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-[720px] items-center px-6">
        <a
          href="/"
          className="flex items-center gap-[9px] text-[15.5px]"
          aria-label="返回首页"
        >
          <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[var(--accent)]" />
          <span className="font-mono text-[14px] text-[var(--ink-4)]">
            /{PROFILE.handle}
          </span>
        </a>
      </div>
    </header>
  );
}
