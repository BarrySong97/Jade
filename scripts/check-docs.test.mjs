/**
 * @purpose 回归验证文档检查器的 Stop hook 输出协议及原有拦截行为
 * @role    pnpm test:hooks / pnpm check 的脚本级集成测试
 * @deps    node:test、node:assert、node:fs、node:child_process；git 用于文档漂移场景
 * @gotcha  所有错误样本均写入临时目录；hook 成功 stdout 只能是 JSON，失败 exit 2 + stderr
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checker = fileURLToPath(new URL("./check-docs.mjs", import.meta.url));
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function fixture(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), "jade-check-docs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "src"));
  for (const [name, content] of Object.entries(files)) {
    const target = join(root, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

function run(root, ...args) {
  const result = spawnSync(process.execPath, [checker, ...args], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify({ hook_event_name: "Stop", stop_hook_active: false }),
  });
  assert.ifError(result.error);
  return result;
}

function driftFixture(t) {
  const root = fixture(t, {
    "src/lib/example.js": "/** @purpose fixture */\nexport const value = 1;\n",
    "docs/modules/lib/README.md": "# Lib\n",
  });
  for (const args of [
    ["init", "--quiet"],
    ["add", "--", "src/lib/example.js"],
  ]) {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
  }
  return root;
}

test("both configured Stop hooks invoke the tested hook mode", () => {
  for (const config of [".codex/hooks.json", ".claude/settings.json"]) {
    const settings = JSON.parse(readFileSync(join(projectRoot, config), "utf8"));
    const commands = settings.hooks.Stop.flatMap((group) =>
      group.hooks.map((hook) => hook.command),
    );
    assert.ok(commands.includes("node scripts/check-docs.mjs --hook"), config);
  }
});

test("a successful Stop hook emits one JSON object without a text report", (t) => {
  const result = run(fixture(t), "--hook");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {});
  assert.equal(result.stderr, "");
});

test("manual checks keep their readable report", (t) => {
  const result = run(fixture(t));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /✅ 全部通过/);
  assert.equal(result.stderr, "");
});

for (const scenario of [
  {
    name: "missing file headers",
    files: { "src/example.js": "export const value = 1;\n" },
    expected: /缺 AI 文件头/,
  },
  {
    name: "broken documentation links",
    files: { "README.md": "[Missing](missing.md)\n" },
    expected: /失效引用/,
  },
]) {
  test(`Stop hooks still block ${scenario.name} with exit 2 and stderr`, (t) => {
    const root = fixture(t, scenario.files);
    const hook = run(root, "--hook");
    assert.equal(hook.status, 2);
    assert.equal(hook.stdout, "");
    assert.match(hook.stderr, scenario.expected);
    assert.match(hook.stderr, /以上问题需先解决/);

    const manual = run(root);
    assert.equal(manual.status, 1);
    assert.match(manual.stdout, scenario.expected);
  });
}

test("nonblocking drift warnings use a JSON systemMessage", (t) => {
  const result = run(driftFixture(t), "--hook");
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.match(output.systemMessage, /疑似文档漂移/);
  assert.equal(output.decision, undefined);
  assert.equal(result.stderr, "");
});

test("strict mode still blocks drift warnings", (t) => {
  const result = run(driftFixture(t), "--hook", "--strict");
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /疑似文档漂移/);
});
