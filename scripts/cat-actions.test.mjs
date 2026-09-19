/**
 * @purpose 验证猫跑跳的姿势完整性、落地、循环和图集采样边界
 * @role pnpm test:meadow 中的动作与资源契约回归
 * @deps node:test、node:assert、sharp、cat-motion.mjs、cat-atlas.mjs
 * @gotcha 解码真实 alpha 检查不串帧和不出界；不能代替浏览器视觉与控件验收
 */
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { CAT_ATLASES } from "../examples/meadow/cat/cat-atlas.mjs";
import {
  catLayout,
  createCatSequence,
  sampleCatSequence,
} from "../examples/meadow/cat/cat-motion.mjs";

test("跑步在桌面和窄屏都改变腿部姿势，单次跑动完成后保留落点", () => {
  for (const width of [280, 375, 1327]) {
    const sequence = createCatSequence("run", catLayout(width, 460), { x: -0.7, direction: 1 });
    const frames = new Set();
    let lastX = -0.7;
    for (let t = 0; t < sequence.duration; t += 0.005) {
      const pose = sampleCatSequence(sequence, t);
      assert.ok(pose.x >= lastX - 1e-6, "往右跑不能瞬间回退");
      assert.equal(pose.lift, 0);
      if (pose.sheet === "run") frames.add(pose.frame);
      lastX = pose.x;
    }
    assert.equal(frames.size, 8);
    const final = sampleCatSequence(sequence, sequence.duration + 10);
    assert.equal(final.done, true);
    assert.equal(final.sheet, "idle");
    assert.equal(final.x, 0.76);
    const back = createCatSequence("run", catLayout(width, 460), final);
    assert.equal(sampleCatSequence(back, 0).direction, -1);
  }
});

test("跳跃有蓄力、腾空和缓冲，只有飞行阶段离地，动作完成保留落点", () => {
  const sequence = createCatSequence("jump", catLayout(1000, 460), { x: 0.75, direction: 1 });
  const phases = new Set();
  const frames = new Set();
  let peak = 0;
  for (let t = 0; t < sequence.duration; t += 0.005) {
    const pose = sampleCatSequence(sequence, t);
    phases.add(pose.kind);
    if (pose.sheet === "jump") frames.add(pose.frame);
    assert.equal(pose.direction, -1, "靠近右边时应往里跳");
    assert.ok(pose.lift >= 0 && pose.lift <= 0.74);
    if (pose.kind !== "flight") assert.equal(pose.lift, 0);
    peak = Math.max(peak, pose.lift);
  }
  for (const phase of ["crouch", "push", "flight", "land", "recover"]) assert.ok(phases.has(phase));
  assert.equal(frames.size, 8);
  assert.ok(peak > 0.73);
  const final = sampleCatSequence(sequence, 100);
  assert.ok(Math.abs(final.x - 0.35) < 1e-6);
  assert.equal(final.lift, 0);
  assert.equal(final.done, true);
});

test("自动演示循环位置连续，休息时间多于运动时间", () => {
  const sequence = createCatSequence("auto", catLayout(1327, 460));
  const before = sampleCatSequence(sequence, sequence.duration - 1e-5);
  const after = sampleCatSequence(sequence, sequence.duration + 1e-5);
  assert.equal(before.x, after.x);
  assert.equal(before.sheet, after.sheet);
  const rest = sequence.segments
    .filter((s) => s.kind === "sit")
    .reduce((a, s) => a + s.duration, 0);
  assert.ok(rest > sequence.duration / 2);
});

test("图集真实透明、每帧留有间隔，所有姿势在窄屏和桌面均不裁掉主体", async () => {
  const bounds = {};
  for (const [name, atlas] of Object.entries(CAT_ATLASES)) {
    const file = new URL(`../examples/meadow/cat/${atlas.file}`, import.meta.url);
    const { data, info } = await sharp(file.pathname)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, atlas.width);
    assert.equal(info.height, atlas.height);
    bounds[name] = atlas.frames.map(({ rect }) => {
      const [sx, sy, w, h] = rect;
      let left = w,
        top = h,
        right = 0,
        bottom = 0,
        clear = 0,
        solid = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const alpha = data[((sy + y) * info.width + sx + x) * 4 + 3];
          if (alpha === 0) clear++;
          if (alpha > 240) solid++;
          if (alpha > 128) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      assert.ok(clear > w * h * 0.5 && solid > 10000, "透明背景和不透明主体都需要保留");
      assert.ok(left > 8 && right < w - 8 && top > 8 && bottom < h - 8, "相邻帧不能贴边串图");
      return { left, top, right, bottom };
    });
  }
  for (const [width, height] of [
    [280, 380],
    [375, 380],
    [1327, 460],
  ]) {
    const layout = catLayout(width, height);
    const sequence = createCatSequence("auto", layout);
    for (let t = 0; t < sequence.duration; t += 0.02) {
      const pose = sampleCatSequence(sequence, t);
      assert.ok(Math.abs(pose.x) <= 0.8);
      if (pose.sheet === "idle") continue;
      const atlas = CAT_ATLASES[pose.sheet];
      const frame = atlas.frames[pose.frame];
      const box = bounds[pose.sheet][pose.frame];
      const scale = (layout.unit * 2.05) / atlas.maxWidth;
      const center = width / 2 + pose.x * layout.travel;
      for (const edge of [box.left, box.right]) {
        const x = center + (edge - frame.anchor[0]) * scale * pose.direction;
        assert.ok(x >= 0 && x <= width, `姿势超出 ${width}px 画布`);
      }
      const y = layout.ground - pose.lift * layout.unit + (box.top - frame.anchor[1]) * scale;
      assert.ok(y >= 0, "跳跃不能顶出画布");
    }
  }
});
