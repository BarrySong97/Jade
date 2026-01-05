import { NavMenu } from "./nav-menu";

export interface FooterProps {
  placeholderText?: string;
  className?: string;
}

export default async function Footer({
  placeholderText = "探索宇宙永葆青春",
}: FooterProps) {
  return (
    <footer className="bg-background ">
      <div className="mx-auto flex max-w-5xl border border-border border-b-0 items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">{placeholderText}</p>
        <NavMenu />
      </div>
    </footer>
  );
}
