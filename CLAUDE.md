# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev       # Start dev server at http://localhost:4321
pnpm build     # Build for production
pnpm preview   # Preview production build
pnpm lint      # Run oxlint
pnpm format    # Run oxfmt
pnpm check     # Run both lint and format
```

## Architecture

This is an Astro + React + Tailwind CSS template with shadcn/ui components.

### Key Technologies
- **Astro 5** with React integration for interactive islands
- **Tailwind CSS 4** via Vite plugin (not PostCSS)
- **shadcn/ui** using the `base-vega` style variant with `@base-ui/react` primitives
- **MDX** support for blog content

### Project Structure
- `src/components/ui/` - shadcn/ui components (use `pnpm dlx shadcn@latest add <component>`)
- `src/components/` - App components (Header, Footer, MainNav, etc.)
- `src/layouts/` - Astro layouts (BaseLayout, BlogPost)
- `src/pages/` - File-based routing
- `src/content/blog/` - MDX/Markdown blog posts with typed frontmatter
- `src/lib/utils.ts` - Utility functions (`cn()` for class merging)
- `src/styles/global.css` - Tailwind config, CSS variables, theme colors

### Path Aliases
- `@/*` maps to `src/*` (e.g., `@/components/ui/button`)

### Styling
- Theme variables defined in `src/styles/global.css` using OKLCH color space
- Dark mode via `.dark` class toggle (stored in localStorage)
- Custom variants: `dark:` and `fixed:` (for fixed layout mode)

### Content Collections
Blog posts in `src/content/blog/` use this frontmatter schema:
```typescript
{ title: string, description: string, pubDate: Date, updatedDate?: Date, heroImage?: ImageMetadata }
```

### React in Astro
Interactive components use `client:load` directive for hydration. The Header uses this for theme toggle and dynamic GitHub stars count.
