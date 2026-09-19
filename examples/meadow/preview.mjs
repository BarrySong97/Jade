/**
 * @purpose 提供花草素材组合的本地预览
 * @role 开发辅助服务，不进入 Astro 构建
 * @deps node:http、node:fs/promises、tailwindcss
 * @gotcha 仅 loopback 监听与白名单路径；CSS 在启动时编译到内存
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { compile } from "tailwindcss";

const base = new URL("./", import.meta.url);
const tailwind = new URL("../../node_modules/tailwindcss/", base);
const [html, theme, preflight] = await Promise.all([
  readFile(new URL("index.html", base), "utf8"),
  readFile(new URL("theme.css", tailwind), "utf8"),
  readFile(new URL("preflight.css", tailwind), "utf8"),
]);
const candidates = [...html.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
const compiler = await compile(
  `@layer theme, base, components, utilities; @layer theme {${theme}} @layer base {${preflight}} @tailwind utilities;`,
);
const css = compiler.build(candidates);
const routes = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/meadow.js", ["meadow.js", "text/javascript; charset=utf-8"]],
  ["/renderer.js", ["renderer.js", "text/javascript; charset=utf-8"]],
]);
for (const name of ["grass-low", "grass-tall", "flower-daisy", "flower-violet", "flower-yellow"]) {
  routes.set(`/assets/${name}.png`, [`assets/${name}.png`, "image/png"]);
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
