/**
 * @purpose 提供首页头像风格对照的本地独立预览
 * @role 开发辅助服务，不进入 Astro 构建
 * @deps node:http、node:fs/promises、已有 tailwindcss，首页原 PNG 与黑白三渲二 PNG
 * @gotcha 仅监听 loopback；固定资源白名单；CSS 启动时编译，改工具类后需重启
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
  ["/preview.js", ["preview.js", "text/javascript; charset=utf-8"]],
  ["/original.png", ["../../src/assets/info/profile-portrait.png", "image/png"]],
  ["/portrait-monochrome-v2.png", ["portrait-monochrome-v2.png", "image/png"]],
]);

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
}).listen(55024, "127.0.0.1", () => console.log("Portrait preview: http://localhost:55024"));
