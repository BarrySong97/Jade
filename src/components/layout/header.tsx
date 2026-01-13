import { NavMenu } from "./nav-menu";

// EDIT HERE: Blog name
const BLOG_NAME = "4REAL";

export interface HeaderProps {
  className?: string;
}

export default async function Header() {
  return (
    <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex 2xl:max-w-5xl max-w-3xl items-center justify-between border border-border  border-t-0  px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold sm:text-2xl">
          <a href="/" className="transition-opacity hover:opacity-80">
            {BLOG_NAME}
          </a>
        </h1>
        <NavMenu />
      </div>
    </header>
  );
}
