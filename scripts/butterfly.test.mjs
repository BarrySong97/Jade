/**
 * @purpose 验证蝴蝶振翅循环、观察过渡、飞行边界和真实透明图集
 * @role pnpm test:meadow 的蝴蝶动作与素材回归
 * @deps node:test、node:assert、sharp、butterfly-motion.mjs
 * @gotcha 检查真实 PNG 与纯函数；不把数据验证当作浏览器视觉验收
 */
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  BUTTERFLY_ATLAS,
  WINGBEAT_SECONDS,
  FLIGHT_SECONDS,
  butterflyLayout,
  butterflyFlightPoint,
  butterflyFocus,
  sampleButterfly,
  projectButterflyPoint,
} from "../examples/meadow/butterfly/butterfly-motion.mjs";

test("蝴蝶使用八个振翅姿势循环，观察方式不改变振翅相位", () => {
  const layout = butterflyLayout(1000, 320);
  for (const cycle of [0, 1, 2, 17]) {
    for (let frame = 0; frame < 8; frame++) {
      const time = (cycle + (frame + 0.5) / 8) * WINGBEAT_SECONDS;
      for (const focus of [0, 0.4, 1])
        assert.equal(sampleButterfly(time, layout, focus).frame, frame);
    }
    assert.equal(sampleButterfly(cycle * WINGBEAT_SECONDS, layout).frame, 0);
  }
});

test("飞行路线首尾位置与方向连续，原地观察时身体注册点固定", () => {
  const layout = butterflyLayout(1000, 320);
  const first = butterflyFlightPoint(0, layout);
  const last = butterflyFlightPoint(FLIGHT_SECONDS, layout);
  for (const key of ["x", "y", "angle"]) assert.ok(Math.abs(first[key] - last[key]) < 1e-8);
  const step = 0.0001;
  const before = butterflyFlightPoint(FLIGHT_SECONDS - step, layout);
  const after = butterflyFlightPoint(step, layout);
  for (const key of ["x", "y"])
    assert.ok(Math.abs((last[key] - before[key]) / step - (after[key] - first[key]) / step) < 0.01);
  for (let t = 0; t < 4; t += 0.007) {
    const pose = sampleButterfly(t, layout, 1);
    assert.equal(pose.x, layout.width / 2);
    assert.equal(pose.y, layout.height / 2);
    assert.equal(Math.abs(pose.angle), 0);
    assert.deepEqual(projectButterflyPoint(BUTTERFLY_ATLAS.frames[pose.frame].anchor, pose), [
      pose.x,
      pose.y,
    ]);
  }
});

test("放大观察可中途反向，切换不会跳位置、尺寸、角度或振翅姿势", () => {
  const layout = butterflyLayout(375, 280);
  let transition = { from: 0, to: 1, at: 1 };
  assert.equal(butterflyFocus(transition, 1), 0);
  assert.equal(butterflyFocus(transition, 2), 1);
  for (const time of [1.13, 1.27, 1.34, 1.61]) {
    const amount = butterflyFocus(transition, time);
    const before = sampleButterfly(time, layout, amount);
    transition = { from: amount, to: 1 - transition.to, at: time };
    assert.deepEqual(sampleButterfly(time, layout, butterflyFocus(transition, time)), before);
  }
});

test("蝴蝶图集透明且有间隔，身体对齐，展开合拢可辨，窄屏飞行不裁翅", async () => {
  const file = new URL("../examples/meadow/butterfly/butterfly-wingbeat-v1.png", import.meta.url);
  const { data, info } = await sharp(file.pathname)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, BUTTERFLY_ATLAS.width);
  assert.equal(info.height, BUTTERFLY_ATLAS.height);
  const boxes = BUTTERFLY_ATLAS.frames.map(({ rect: [sx, sy, width, height], anchor }) => {
    let left = width,
      right = 0,
      top = height,
      bottom = 0,
      solid = 0,
      clear = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
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
    assert.ok(clear > width * height * 0.7 && solid > 8000, "保留透明背景和不透明蝴蝶");
    assert.ok(
      left > 20 && right < width - 20 && top > 20 && bottom < height - 20,
      "翅膀与触须不能串进邻帧",
    );
    const offset = ((sy + anchor[1]) * info.width + sx + anchor[0]) * 4;
    assert.ok(data[offset + 3] > 240, "身体注册点必须位于真实主体");
    assert.ok(data[offset] < 180 && data[offset + 1] < 165, "注册点应位于较深色身体而非黄色翅膀");
    return { left, right, top, bottom };
  });
  assert.ok(
    boxes[0].right - boxes[0].left > (boxes[4].right - boxes[4].left) * 2.5,
    "开合须改变翅膀轮廓",
  );
  for (const [width, height] of [
    [240, 280],
    [335, 280],
    [375, 280],
    [1327, 320],
  ]) {
    const layout = butterflyLayout(width, height);
    for (let time = 0; time < FLIGHT_SECONDS; time += 0.017)
      for (const focus of [0, 0.25, 0.5, 0.75, 1]) {
        const pose = sampleButterfly(time, layout, focus);
        const box = boxes[pose.frame];
        for (const x of [box.left, box.right])
          for (const y of [box.top, box.bottom]) {
            const point = projectButterflyPoint([x, y], pose);
            assert.ok(
              point[0] >= 0 && point[0] <= width && point[1] >= 0 && point[1] <= height,
              `蝴蝶超出 ${width}×${height} 画布`,
            );
          }
      }
  }
});
