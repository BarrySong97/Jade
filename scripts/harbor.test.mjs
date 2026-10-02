/**
 * @purpose 验证海港出航连续性、响应式边界与真实海鸥图集留白
 * @role pnpm test:harbor，接入 pnpm check
 * @deps node:test、sharp、examples/harbor/scene.mjs
 * @gotcha 必须解码原图验证格边和注册点，避免生成图翼尖串帧；sharp 输入用文件 Buffer，不传 URL 对象；不以数据测试代替实际观感验收
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  ASSET_NAMES,
  GULL_ATLAS,
  VOYAGE_SECONDS,
  gullFrame,
  gullRect,
  sampleBoat,
  sampleGull,
  sceneLayout,
  shipyardLayout,
  sampleWorker,
} from "../examples/harbor/scene.mjs";

test("boat leaves harbor, recedes, and resets only while invisible", () => {
  const layout = sceneLayout(1280, 470);
  const start = sampleBoat(2, layout);
  const middle = sampleBoat(28, layout);
  const far = sampleBoat(50, layout);
  assert.ok(start.x < middle.x && middle.x < far.x);
  assert.ok(start.y > middle.y && middle.y > far.y);
  assert.ok(start.width > middle.width && middle.width > far.width);
  assert.equal(sampleBoat(VOYAGE_SECONDS - 0.001, layout).opacity, 0);
  assert.equal(sampleBoat(VOYAGE_SECONDS, layout).opacity, 0);
  for (let t = 1; t < 54; t += 0.25) {
    const a = sampleBoat(t, layout);
    const b = sampleBoat(t + 0.001, layout);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.1, `jump at ${t}`);
  }
});

test("entire boat and gull frames fit from narrow mobile to desktop", () => {
  for (const width of [240, 320, 375, 768, 1280, 1920]) {
    const layout = sceneLayout(width, width < 640 ? 250 : width < 1024 ? 360 : 470);
    for (let t = 0; t < 128; t += 0.1) {
      const boat = sampleBoat(t, layout);
      assert.ok(boat.x - boat.width * 0.53 >= 0);
      assert.ok(boat.x + boat.width * 0.51 <= width);
      assert.ok(boat.y - boat.width * 0.94 >= 0);
      assert.ok(boat.y + boat.width * 0.11 <= layout.height);
      for (let i = 0; i < 3; i++) {
        const bird = sampleGull(t, i, layout);
        assert.ok(bird.x - bird.span >= 0 && bird.x + bird.span <= width);
        assert.ok(bird.y - bird.span >= 0 && bird.y + bird.span <= layout.height);
      }
    }
  }
});

test("larger boat and three workers remain planted inside shipyard", () => {
  assert.ok(sceneLayout(1280, 470).boatWidth > 180);
  for (const width of [240, 375, 1280, 1920]) {
    const layout = sceneLayout(width, width < 640 ? 250 : 470);
    const yard = shipyardLayout(layout);
    assert.ok(yard.x >= 0 && yard.x + yard.width <= width);
    assert.ok(yard.y + yard.height <= layout.height);
    for (let i = 0; i < 3; i++) {
      const frames = new Set();
      for (let t = 0; t < 8; t += 0.1) {
        const worker = sampleWorker(t, i, yard);
        assert.equal(worker.y, sampleWorker(0, i, yard).y);
        assert.ok(worker.x > yard.x && worker.x < yard.x + yard.width);
        frames.add(worker.frame);
      }
      assert.equal(frames.size, 4);
    }
  }
});

test("gulls have a full flap cycle and a longer gliding interval", () => {
  assert.deepEqual(
    Array.from({ length: 8 }, (_, i) => gullFrame(i * 0.1 + 0.01)),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  for (const time of [1.7, 2, 3, 4.3]) assert.equal(gullFrame(time), 2);
});

test("generated originals and runtime assets have real transparent backgrounds", async () => {
  for (const name of ASSET_NAMES) {
    for (const ext of ["png", "webp"]) {
      const path = new URL(`../examples/harbor/assets/${name}.${ext}`, import.meta.url);
      const buffer = await readFile(path);
      const meta = await sharp(buffer).metadata();
      const stats = await sharp(buffer).stats();
      assert.equal(meta.hasAlpha, true);
      assert.equal(stats.channels[3].min, 0);
      assert.ok(stats.channels[3].max >= 250);
    }
  }
});

test("gull atlas has safe gutters and shoulder registration on real pixels", async () => {
  const buffer = await readFile(
    new URL("../examples/harbor/assets/gull-wingbeat-v2.png", import.meta.url),
  );
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, GULL_ATLAS.width);
  assert.equal(info.height, GULL_ATLAS.height);
  for (let frame = 0; frame < 8; frame++) {
    const [x, y, w, h] = gullRect(frame);
    const [ax, ay] = GULL_ATLAS.anchors[frame];
    assert.ok(data[((y + ay) * info.width + x + ax) * 4 + 3] > 100, `shoulder ${frame}`);
    let pixels = 0;
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) {
        if (data[((y + dy) * info.width + x + dx) * 4 + 3] > 100) {
          pixels++;
          assert.ok(
            dx >= 20 && dx < w - 20 && dy >= 20 && dy < h - 20,
            `unsafe cell edge ${frame}: ${dx},${dy}`,
          );
        }
      }
    assert.ok(pixels > 5000, `empty frame ${frame}`);
  }
});

test("harbor demo remains outside production about route", async () => {
  const about = await readFile(new URL("../src/pages/about.astro", import.meta.url), "utf8");
  assert.doesNotMatch(about, /harbor|55025/);
});
