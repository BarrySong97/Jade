/**
 * @purpose 编译示例的 Tailwind 工具类并提供本地预览
 * @role 独立教学示例入口，不改变 Astro 生产构建
 * @deps node:http、node:fs/promises、tailwindcss
 * @gotcha 只监听 127.0.0.1；只允许明确列出的静态资源，不暴露整个仓库
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
  ["/demo.js", ["demo.js", "text/javascript; charset=utf-8"]],
  ["/grass.png", ["grass.png", "image/png"]],
]);
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  response.setHeader("Cache-Control", "no-store");
  if (pathname === "/demo.css") {
    response.writeHead(200, { "Content-Type": "text/css; charset=utf-8" }).end(css);
    return;
  }
  const route = routes.get(pathname);
  if (!route) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(new URL(route[0], base));
    response.writeHead(200, { "Content-Type": route[1] }).end(body);
  } catch {
    response.writeHead(500).end("Preview asset unavailable");
  }
});
server.listen(55021, "127.0.0.1", () => {
  console.log("Grass PNG demo: http://localhost:55021");
});
