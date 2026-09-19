/**
 * @purpose 防止草甸迁入首页后改变已确认的密度、排布或页面边界
 * @role Node 回归测试，接入 pnpm check
 * @deps node:test、node:assert、共享排布与原预览场景
 * @gotcha ADR-0006：首页草甸不可被通用布局或其他页面直接挂载
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { arrangeNaturalMeadow, meadowReferencePopulation } from "../src/lib/meadow-layout.mjs";
import { arrangeScene, ASSETS, SCENES } from "../examples/meadow/scene-data.mjs";

const byId = Object.fromEntries(ASSETS.map((asset) => [asset.id, asset]));
const current = SCENES.find((scene) => scene.id === "wild-meadow");
const previous = SCENES.find((scene) => scene.id === "wild-meadow-v1");

test("首页与选定预览排布一致，株数仍为旧版的 90%", () => {
  // 包含手机、首页高度、预览高度，以及曾导致计数漂移的浮点整倍数。
  for (const [width, height] of [
    [375, 176],
    [333, 280],
    [640, 240],
    [1425, 240],
    [1327, 340],
    [798, 280],
    [1536, 320],
    [1104, 340],
    [2560, 240],
  ]) {
    const old = arrangeScene(previous, width, height, byId);
    const plants = arrangeNaturalMeadow(current, width, height, byId);
    assert.deepEqual(meadowReferencePopulation(width, height), {
      total: old.length,
      grass: old.filter((plant) => plant.asset.id.startsWith("grass")).length,
    });
    assert.equal(plants.length, Math.round(old.length * 0.9));
    assert.deepEqual(plants, arrangeScene(current, width, height, byId));
  }
});

test("重复排布稳定，非正画布安全返回空集合", () => {
  const plants = arrangeNaturalMeadow(current, 1440, 240, byId);
  assert.deepEqual(arrangeNaturalMeadow(current, 1440, 240, byId), plants);
  assert.notDeepEqual(arrangeNaturalMeadow({ seed: 9 }, 1440, 240, byId), plants);
  for (const [width, height] of [
    [0, 240],
    [1440, 0],
    [-1, 240],
  ]) {
    assert.deepEqual(arrangeNaturalMeadow(current, width, height, byId), []);
    assert.deepEqual(meadowReferencePopulation(width, height), { grass: 0, total: 0 });
  }
});

test("ADR-0006：只有首页挂载草甸，通用布局只提供 Footer 后插槽", async () => {
  const root = new URL("../src/", import.meta.url);
  const files = await readdir(root, { recursive: true });
  const imports = [];
  for (const path of files.filter((path) => /\.(astro|[cm]?[jt]sx?)$/.test(path))) {
    if (path.startsWith("components/home/home-meadow")) continue;
    const text = await readFile(new URL(path, root), "utf8");
    if (/home-meadow(?:\.astro|-client|[\s>])/.test(text)) imports.push(path);
  }
  assert.deepEqual(imports, ["pages/index.astro"], "ADR-0006：草甸只允许从首页接入");
  const index = await readFile(new URL("pages/index.astro", root), "utf8");
  const layout = await readFile(new URL("layouts/BaseLayout.astro", root), "utf8");
  assert.match(index, /<HomeMeadow\s+slot="page-end"\s*\/>/);
  assert.match(layout, /<Footer\s*\/>\s*<slot name="page-end"\s*\/>/);
});
