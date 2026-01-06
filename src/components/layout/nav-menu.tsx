import { cn } from "@/lib/utils";

// EDIT HERE: Navigation links
const NAV_LINKS = [
  { href: "/", label: "关于" },
  { href: "/blog", label: "博客" },
  { href: "/products", label: "作品" },
] as const;

export interface NavMenuProps {
  className?: string;
}

export function NavMenu({ className }: NavMenuProps) {
  return (
    <nav className={cn("flex items-center gap-6", className)}>
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
