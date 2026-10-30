/**
 * @purpose 防止「开始使用某个 shadcn 组件却忘了把它移出 Tailwind 排除列表」导致它的类没被生成
 * @role pnpm test:css,接入 pnpm check
 * @deps node:test、src/styles/global.css 的 `@source not "../components/ui/{…}.tsx"`
 * @gotcha 只检查静态 import(`@/components/ui/x` 与 ui 内部的 `./x`);被排除的组件即使样式缺失也能构建成功,所以必须靠这个测试拦
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const UI = join(SRC, "components", "ui");

async function excludedUi() {
  const css = await readFile(join(SRC, "styles", "global.css"), "utf8");
  const m = css.match(/@source not "\.\.\/components\/ui\/\{([^}]+)\}\.tsx";/);
  assert.ok(m, "global.css 里找不到 ui 组件排除列表");
  return new Set(m[1].split(",").map((s) => s.trim()));
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx?|astro|mdx?|jsx?|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

test("被使用的 shadcn 组件不在 Tailwind 排除列表里", async () => {
  const excluded = await excludedUi();
  const used = new Map();
  const queue = [];
  for (const file of await walk(SRC)) {
    if (file.startsWith(UI)) continue;
    const text = await readFile(file, "utf8");
    for (const [, name] of text.matchAll(/["']@\/components\/ui\/([\w-]+)["']/g)) {
      used.set(name, relative(ROOT, file));
      queue.push(name);
    }
  }
  // 被使用的组件内部再引用的组件同样会出现在页面上
  while (queue.length) {
    const name = queue.pop();
    const text = await readFile(join(UI, `${name}.tsx`), "utf8").catch(() => "");
    for (const [, dep] of text.matchAll(/["'](?:\.\/|@\/components\/ui\/)([\w-]+)["']/g)) {
      if (!used.has(dep)) {
        used.set(dep, `components/ui/${name}.tsx`);
        queue.push(dep);
      }
    }
  }
  const wrong = [...used].filter(([name]) => excluded.has(name)).map(([n, f]) => `${n}(用于 ${f})`);
  assert.deepEqual(
    wrong,
    [],
    `请把这些组件从 global.css 的 @source not 列表删掉:${wrong.join("、")}`,
  );
});
