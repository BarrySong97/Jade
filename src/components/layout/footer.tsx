import { PROFILE } from "@/lib/site";

export interface FooterProps {
  className?: string;
}

export default async function Footer() {
  return (
    <footer className="mt-[104px]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-1 px-6 pb-8 pt-6 sm:flex-row sm:justify-between">
        <span className="font-mono text-[11.5px] text-[var(--ink-4)]">
          © 2026 {PROFILE.name} · {PROFILE.title} · {PROFILE.location}
        </span>
        <span className="font-mono text-[11.5px] text-[var(--ink-4)]">用克制构建</span>
      </div>
    </footer>
  );
}
