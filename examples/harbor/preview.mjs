/**
 * @purpose 海港动画独立本地预览服务
 * @role 不进入 Astro 的开发辅助入口
 * @deps node:http、node:fs/promises、tailwindcss、scene.mjs
 * @gotcha 只监听 loopback，资源显式白名单；Tailwind 启动时编译到内存，不开放目录遍历
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { compile } from "tailwindcss";
import { ASSET_NAMES } from "./scene.mjs";

const base = new URL("./", import.meta.url);
const tailwind = new URL("../../node_modules/tailwindcss/", base);
const [html, theme, preflight] = await Promise.all([
  readFile(new URL("index.html", base), "utf8"),
  readFile(new URL("theme.css", tailwind), "utf8"),
  readFile(new URL("preflight.css", tailwind), "utf8"),
]);
const compiler = await compile(
  `@layer theme, base, components, utilities; @layer theme {${theme}} @layer base {${preflight}} @tailwind utilities;`,
);
const css = compiler.build(
  [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/)),
);
const routes = new Map([
  [
    "/src/lib/harbor-scene.mjs",
    ["../../src/lib/harbor-scene.mjs", "text/javascript; charset=utf-8"],
  ],
  [
    "/src/components/about/harbor-renderer.js",
    ["../../src/components/about/harbor-renderer.js", "text/javascript; charset=utf-8"],
  ],
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/harbor.js", ["harbor.js", "text/javascript; charset=utf-8"]],
  ["/scene.mjs", ["scene.mjs", "text/javascript; charset=utf-8"]],
]);
for (const name of ASSET_NAMES) {
  for (const extension of ["png", "webp"]) {
    const file = `assets/${name}.${extension}`;
    routes.set(`/${file}`, [file, `image/${extension}`]);
  }
}
createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  response.setHeader("Cache-Control", "no-store");
  if (pathname === "/style.css") {
    response.writeHead(200, { "Content-Type": "text/css; charset=utf-8" }).end(css);
    return;
  }
  const route = routes.get(pathname);
  if (!route) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    response
      .writeHead(200, { "Content-Type": route[1] })
      .end(await readFile(new URL(route[0], base)));
  } catch {
    response.writeHead(500).end("Preview asset unavailable");
  }
}).listen(55025, "127.0.0.1", () => console.log("Harbor preview: http://localhost:55025"));
