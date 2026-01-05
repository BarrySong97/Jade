// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

import mdx from "@astrojs/mdx";

import robotsTxt from "astro-robots-txt";

const site = process.env.VERCEL
  ? process.env.VERCEL_ENV === "production"
    ? "https://astro-shadcn-ui-template.vercel.app"
    : `https://${process.env.VERCEL_URL}`
  : process.env.SITE ?? "http://localhost:4321";
const base = process.env.BASE || "/";

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [react(), sitemap(), mdx(), robotsTxt()],
  markdown: {
    shikiConfig: {
      theme: "catppuccin-latte",
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
