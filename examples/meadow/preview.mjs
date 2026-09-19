/**
 * @purpose 提供花草素材组合的本地预览
 * @role 开发辅助服务，不进入 Astro 构建
 * @deps node:http、node:fs/promises、tailwindcss、scene-data.mjs 与猫素材/独立动画模块固定路由
 * @gotcha 仅 loopback 监听与白名单路径；CSS 在启动时编译到内存
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { compile } from "tailwindcss";
import { ASSETS } from "./scene-data.mjs";

const base = new URL("./", import.meta.url);
const tailwind = new URL("../../node_modules/tailwindcss/", base);
const [original, variations, theme, preflight] = await Promise.all([
  readFile(new URL("index.html", base), "utf8"),
  readFile(new URL("variations.html", base), "utf8"),
  readFile(new URL("theme.css", tailwind), "utf8"),
  readFile(new URL("preflight.css", tailwind), "utf8"),
]);
const candidates = [...`${original}\n${variations}`.matchAll(/class="([^"]+)"/g)].flatMap((match) =>
  match[1].split(/\s+/),
);
const compiler = await compile(
  `@layer theme, base, components, utilities; @layer theme {${theme}} @layer base {${preflight}} @tailwind utilities;`,
);
const css = compiler.build(candidates);
const routes = new Map([
  ["/", ["variations.html", "text/html; charset=utf-8"]],
  ["/original", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/meadow.js", ["meadow.js", "text/javascript; charset=utf-8"]],
  ["/renderer.js", ["renderer.js", "text/javascript; charset=utf-8"]],
  [
    "/src/components/home/meadow-renderer.js",
    ["../../src/components/home/meadow-renderer.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/src/lib/meadow-layout.mjs",
    ["../../src/lib/meadow-layout.mjs", "text/javascript; charset=utf-8"],
  ],
  ["/variations.js", ["variations.js", "text/javascript; charset=utf-8"]],
  ["/scene-data.mjs", ["scene-data.mjs", "text/javascript; charset=utf-8"]],
  ["/natural-meadow.mjs", ["natural-meadow.mjs", "text/javascript; charset=utf-8"]],
  ["/cat/cat-idle-v1.png", ["cat/cat-idle-v1.png", "image/png"]],
  ["/cat/body-no-tail-v1.png", ["cat/body-no-tail-v1.png", "image/png"]],
  ["/cat/tail-v1.png", ["cat/tail-v1.png", "image/png"]],
  ["/cat/cat-board.js", ["cat/cat-board.js", "text/javascript; charset=utf-8"]],
  ["/cat/cat-renderer.js", ["cat/cat-renderer.js", "text/javascript; charset=utf-8"]],
  ["/cat/tail-motion.mjs", ["cat/tail-motion.mjs", "text/javascript; charset=utf-8"]],
]);
for (const { id } of ASSETS) {
  routes.set(`/assets/${id}.png`, [`assets/${id}.png`, "image/png"]);
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
    const data = await readFile(new URL(route[0], base));
    response.writeHead(200, { "Content-Type": route[1] }).end(data);
  } catch {
    response.writeHead(500).end("Preview asset unavailable");
  }
}).listen(55022, "127.0.0.1", () => console.log("Meadow preview: http://localhost:55022"));
