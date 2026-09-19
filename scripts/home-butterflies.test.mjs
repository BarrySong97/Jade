/**
 * @purpose 验证首页双蝴蝶的颜色、落花贴合、路径范围与猫素材隔离
 * @role pnpm test:meadow 的生产装饰回归，执行 ADR-0010
 * @deps node:test、node:assert、node:fs、sharp、meadow-butterflies.mjs 与四张图集
 * @gotcha 真实 alpha 范围优先于矩形猜测；程序测试不能代替浏览器视觉验收
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { BUTTERFLY_ATLASES, butterflySprite } from "../src/lib/butterfly-atlas.mjs";
import {
  meadowButterflyLayout,
  sampleMeadowButterfly,
  meadowFlowerPoint,
} from "../src/lib/meadow-butterflies.mjs";
import { MEADOW_ASSET_IDS, arrangeNaturalMeadow } from "../src/lib/meadow-layout.mjs";
import { meadowPoint, MEADOW_ROWS } from "../src/lib/meadow-wind.mjs";
const base = new URL("../examples/meadow/", import.meta.url);
const paths = {
  "amber-wing": "butterfly/butterfly-wingbeat-v1.png",
  "amber-perch": "chase/butterfly-perch-v1.png",
  "blue-wing": "butterfly/butterfly-blue-wingbeat-v1.png",
  "blue-perch": "butterfly/butterfly-blue-perch-v1.png",
};
async function raw(file) {
  return sharp(new URL(file, base).pathname)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}
const plants = Promise.all(
  MEADOW_ASSET_IDS.map(async (id) => {
    const { data, info } = await raw(`assets/${id}.png`);
    let left = info.width,
      top = info.height,
      right = 0,
      bottom = 0;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 8) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    return [
      id,
      {
        id,
        aspect: (right - left + 1) / (bottom - top + 1),
        crop: [
          left / info.width,
          top / info.height,
          (right - left + 1) / info.width,
          (bottom - top + 1) / info.height,
        ],
      },
    ];
  }),
).then(Object.fromEntries);
const sheets = Promise.all(
  Object.entries(paths).map(async ([id, file]) => {
    const { data, info } = await raw(file),
      atlas = BUTTERFLY_ATLASES[id];
    assert.equal(info.width, atlas.width);
    assert.equal(info.height, atlas.height);
    let red = 0,
      blue = 0,
      pixels = 0;
    const boxes = atlas.frames.map(({ rect: [sx, sy, w, h] }) => {
      const box = { left: w, right: 0, top: h, bottom: 0, clear: 0, solid: 0 };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const offset = ((sy + y) * info.width + sx + x) * 4,
            alpha = data[offset + 3];
          if (alpha === 0) box.clear++;
          if (alpha > 240) {
            box.solid++;
            red += data[offset];
            blue += data[offset + 2];
            pixels++;
          }
          if (alpha > 128) {
            box.left = Math.min(box.left, x);
            box.right = Math.max(box.right, x);
            box.top = Math.min(box.top, y);
            box.bottom = Math.max(box.bottom, y);
          }
        }
      return box;
    });
    return [id, { boxes, color: (blue - red) / pixels }];
  }),
).then(Object.fromEntries);

test("双蝴蝶图集有透明间隔，杏黄与蓝紫来自不同原画颜色", async () => {
  const data = await sheets;
  assert.equal(Object.keys(data).length, 4);
  for (const [id, { boxes, color }] of Object.entries(data)) {
    assert.ok(id.startsWith("blue") ? color > 20 : color < -20, `${id} 颜色必须明确不同`);
    boxes.forEach((b, i) => {
      const [, , w, h] = BUTTERFLY_ATLASES[id].frames[i].rect;
      assert.ok(b.clear > w * h * 0.65 && b.solid > 8000, `${id}/${i} 透明与实体`);
      assert.ok(
        b.left > 18 && b.top > 18 && b.right < w - 18 && b.bottom < h - 18,
        `${id}/${i} 不串帧`,
      );
    });
  }
});

test("两只蝴蝶节奏不同、落在不同花株，脚部跟随共享风动网格", async () => {
  const byId = await plants;
  for (const [width, height] of [
    [335, 176],
    [1440, 240],
  ]) {
    const flora = arrangeNaturalMeadow({ seed: 5.6 }, width, height, byId),
      layout = meadowButterflyLayout(width, height, flora);
    assert.equal(layout.butterflies.length, 2);
    assert.notEqual(layout.butterflies[0].period, layout.butterflies[1].period);
    assert.ok(layout.butterflies[0].flowers.length && layout.butterflies[1].flowers.length);
    assert.ok(
      !layout.butterflies[0].flowers.some((f) => layout.butterflies[1].flowers.includes(f)),
    );
    for (const fly of layout.butterflies) {
      const time = fly.period - 4.5 - fly.offset;
      for (const wind of [0, 0.45, 1]) {
        const pose = sampleMeadowButterfly(layout, fly.index, time, wind);
        assert.equal(pose.state, "perched");
        assert.deepEqual([pose.x, pose.y], meadowFlowerPoint(pose.flower, time, wind));
        const sprite = butterflySprite(pose),
          frame = BUTTERFLY_ATLASES[pose.id].frames[pose.frame],
          scale = pose.span / BUTTERFLY_ATLASES[pose.id].span;
        assert.ok(Math.abs(sprite.rect[0] + frame.anchor[0] * scale - pose.x) < 1e-8);
        assert.ok(Math.abs(sprite.rect[1] + frame.anchor[1] * scale - pose.y) < 1e-8);
        const root = meadowPoint(pose.flower, 0.5, 1, time, wind);
        assert.deepEqual(root, [pose.flower.x, pose.flower.base]);
        const v = 0.37,
          row = Math.floor(v * (MEADOW_ROWS - 1)),
          f = v * (MEADOW_ROWS - 1) - row;
        const a = meadowPoint(pose.flower, 0.5, row / (MEADOW_ROWS - 1), time, wind),
          b = meadowPoint(pose.flower, 0.5, (row + 1) / (MEADOW_ROWS - 1), time, wind),
          point = meadowPoint(pose.flower, 0.5, v, time, wind);
        assert.ok(Math.abs(point[0] - a[0] * (1 - f) - b[0] * f) < 1e-8);
      }
    }
  }
});

test("落花、起飞与循环的位置和倾斜角度连续", async () => {
  const byId = await plants,
    layout = meadowButterflyLayout(1440, 240, arrangeNaturalMeadow({ seed: 5.6 }, 1440, 240, byId));
  for (const fly of layout.butterflies)
    for (const cycle of [0, 1, 2])
      for (const local of [
        0,
        fly.period - 7.8,
        fly.period - 6.35,
        fly.period - 5.8,
        fly.period - 1.8,
        fly.period - 0.4,
        fly.period,
      ]) {
        const time = cycle * fly.period + local - fly.offset;
        if (time < 0.0001) continue;
        const a = sampleMeadowButterfly(layout, fly.index, time - 1e-5),
          b = sampleMeadowButterfly(layout, fly.index, time + 1e-5);
        for (const key of ["x", "y", "angle"])
          assert.ok(
            Math.abs(a[key] - b[key]) < (key === "angle" ? 0.001 : 0.02),
            `${fly.color}/${local}/${key} 跳变`,
          );
      }
});

test("手机和宽屏的真实翅膀轮廓留在首页草甸画布内", async () => {
  const [byId, all] = await Promise.all([plants, sheets]);
  for (const [width, height] of [
    [240, 176],
    [335, 176],
    [375, 176],
    [768, 240],
    [1440, 240],
    [1920, 240],
  ]) {
    const layout = meadowButterflyLayout(
      width,
      height,
      arrangeNaturalMeadow({ seed: 5.6 }, width, height, byId),
    );
    for (let t = 0; t < 120; t += 0.071)
      for (const index of [0, 1]) {
        const pose = sampleMeadowButterfly(layout, index, t),
          atlas = BUTTERFLY_ATLASES[pose.id],
          frame = atlas.frames[pose.frame],
          box = all[pose.id].boxes[pose.frame],
          scale = pose.span / atlas.span;
        for (const x of [box.left, box.right])
          for (const y of [box.top, box.bottom]) {
            const dx = (x - frame.anchor[0]) * scale,
              dy = (y - frame.anchor[1]) * scale;
            const px = pose.x + dx * Math.cos(pose.angle) - dy * Math.sin(pose.angle),
              py = pose.y + dx * Math.sin(pose.angle) + dy * Math.cos(pose.angle);
            assert.ok(
              px >= 0 && px <= width && py >= 0 && py <= height,
              `${width}px ${pose.id} ${pose.state} 越界`,
            );
          }
      }
  }
});

test("ADR-0010：首页客户端不加载猫/demo 模块，静态回退保留两色蝴蝶", async () => {
  const root = new URL("../", import.meta.url),
    seen = new Set();
  async function scan(url) {
    if (seen.has(url.href)) return;
    seen.add(url.href);
    assert.ok(
      !url.pathname.includes("/examples/") && !/cat-|chase-/.test(url.pathname),
      "ADR-0010：首页不加载猫或 demo 逻辑",
    );
    const text = await readFile(url, "utf8");
    for (const match of text.matchAll(/from\s+["'](\.[^"']+\.[mj]s)["']/g))
      await scan(new URL(match[1], url));
  }
  await scan(new URL("src/components/home/home-meadow-client.js", root));
  const component = await readFile(new URL("src/components/home/home-meadow.astro", root), "utf8");
  assert.doesNotMatch(component, /cat-[^"']+\.png/);
  assert.match(component, /data-butterfly-static/);
  for (const color of ["amber", "blue"]) assert.match(component, new RegExp(`"${color}-wing"`));
});
