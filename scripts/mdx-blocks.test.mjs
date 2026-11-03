/**
 * @purpose 防止文章里块级组件(图片、卡片、嵌入)和正文写在同一行,被 MDX 包进 <p>
 * @role pnpm test:mdx,接入 pnpm check
 * @deps node:test、src/content/blog/*.mdx
 * @gotcha `<BlogImage …/>正文` 会生成 `<p><astro-island><figure>`:浏览器遇到 figure 就关掉 p,连 astro-island 一起关,figure 落到岛外,client:visible 永远不触发 → 不水合、不能放大、正文也脱离了段落。构建与控制台都不报错,只能靠这里拦
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const BLOG = new URL("../src/content/blog/", import.meta.url).pathname;
// 渲染成 figure / div / iframe 的组件
const BLOCKS = ["BlogImage", "ImageStrip", "LinkCard", "BilibiliEmbed", "TikTokEmbed"];
const OPEN = new RegExp(`<(${BLOCKS.join("|")})\\b`, "g");

function check(text) {
  // 代码块里的示例不算
  const src = text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (m) =>
    m.replace(/[^\n]/g, " "),
  );
  const lineOf = (i) => src.slice(0, i).split("\n").length;
  const wrong = [];
  for (const m of src.matchAll(OPEN)) {
    const start = m.index;
    const lineStart = src.lastIndexOf("\n", start - 1) + 1;
    const selfClose = src.indexOf("/>", start);
    const close = src.indexOf(`</${m[1]}>`, start);
    const end =
      close !== -1 && (selfClose === -1 || close < selfClose)
        ? close + m[1].length + 3
        : selfClose + 2;
    const lineEnd = src.indexOf("\n", end);
    const before = src.slice(lineStart, start);
    const after = src.slice(end, lineEnd === -1 ? undefined : lineEnd);
    if (before.trim() || after.trim()) wrong.push(`第 ${lineOf(start)} 行 <${m[1]}>`);
  }
  return wrong;
}

test("块级组件单独成行", async () => {
  const wrong = [];
  for (const name of await readdir(BLOG)) {
    if (!name.endsWith(".mdx")) continue;
    for (const w of check(await readFile(join(BLOG, name), "utf8"))) wrong.push(`${name} ${w}`);
  }
  assert.deepEqual(wrong, [], `这些组件和正文挤在同一行,前后各空一行:\n${wrong.join("\n")}`);
});

test("能识别同一行里的正文", () => {
  assert.equal(check(`<BlogImage src="a" />正文\n`).length, 1);
  assert.equal(check(`正文 <LinkCard url="a" />\n`).length, 1);
  assert.equal(check(`<BlogImage src="a" />\n\n正文\n`).length, 0);
  assert.equal(check(`<ImageStrip\n  images={[]}\n/>\n`).length, 0);
  assert.equal(check("```tsx\nx <BlogImage />\n```\n").length, 0);
});
