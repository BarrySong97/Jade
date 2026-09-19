/**
 * @purpose 验证猫的动作衔接、安全切换、图集边界与辅助关节坐标
 * @role pnpm test:meadow 中的动作与资源契约回归
 * @deps node:test、node:assert、sharp、cat-motion.mjs、cat-atlas.mjs、cat-skeleton.mjs
 * @gotcha 解码真实 alpha 检查不串帧和不出界；不能代替浏览器视觉与控件验收
 */
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  CAT_ATLASES,
  catPoseTransform,
  projectCatPoint,
} from "../examples/meadow/cat/cat-atlas.mjs";
import { CAT_SKELETONS, catSkeleton } from "../examples/meadow/cat/cat-skeleton.mjs";
import { deformTailPoint } from "../examples/meadow/cat/tail-motion.mjs";
import {
  catLayout,
  catSequenceTime,
  createCatSequence,
  nextCatSwitchTime,
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
    assert.equal(sampleCatSequence(back, 0).direction, final.direction, "先保持原朝向");
    assert.ok(
      back.segments.some((s) => s.kind === "turn"),
      "折返前需要转身",
    );
    assert.equal(back.segments.find((s) => s.kind === "run").direction, -1);
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
    if (pose.kind === "flight") assert.equal(pose.direction, -1, "靠近右边时应转身往里跳");
    assert.ok(pose.lift >= 0 && pose.lift <= 0.74);
    if (pose.kind !== "flight") assert.equal(pose.lift, 0);
    peak = Math.max(peak, pose.lift);
  }
  for (const phase of ["rise", "turn", "crouch", "push", "flight", "land", "recover", "lower"])
    assert.ok(phases.has(phase));
  assert.deepEqual([...frames].sort(), [0, 1, 2, 3, 4, 5, 6]);
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

test("跑跳从坐姿经过起身再运动，结束先恢复站立再坐下", () => {
  const layout = catLayout(1000, 460);
  const kinds = (mode) => createCatSequence(mode, layout).segments.map((s) => s.kind);
  const run = kinds("run");
  const jump = kinds("jump");
  for (const [steps, expected] of [
    [run, ["rise", "start", "run", "brake", "stand", "lower", "sit"]],
    [jump, ["rise", "crouch", "push", "flight", "land", "recover", "stand", "lower", "sit"]],
  ]) {
    let cursor = -1;
    for (const phase of expected) {
      cursor = steps.indexOf(phase, cursor + 1);
      assert.ok(cursor >= 0, `缺少顺序正确的 ${phase}`);
    }
  }
});

test("起跑与收步的位置和速度连续，静坐尾巴与观察距离在边界处连续", () => {
  const layout = catLayout(1000, 460);
  for (const mode of ["auto", "run", "jump", "rest", "tail"]) {
    const sequence = createCatSequence(mode, layout);
    let boundary = 0;
    const epsilon = 1e-6;
    for (const segment of sequence.segments.slice(0, -1)) {
      boundary += segment.duration;
      const before = sampleCatSequence(sequence, boundary - epsilon);
      const after = sampleCatSequence(sequence, boundary + epsilon);
      assert.ok(Math.abs(before.x - after.x) < 1e-4, `${mode}/${segment.kind} 不能瞬移`);
      assert.ok(Math.abs(before.study - after.study) < 1e-4, "观察距离不能突然缩放");
      if (before.sheet === "idle" && after.sheet === "idle")
        assert.ok(Math.abs(before.tailWeight - after.tailWeight) < 1e-4, "尾巴不能突然归零");
      if (segment.kind === "start" || segment.kind === "run") {
        const at = sampleCatSequence(sequence, boundary);
        const leftVelocity = (at.x - before.x) / epsilon;
        const rightVelocity = (after.x - at.x) / epsilon;
        assert.ok(Math.abs(leftVelocity - rightVelocity) < 1e-4, "起跑/匀速/收步衔接不能跳速");
      }
    }
  }
});

test("ADR-0008：新动作等坐稳或站稳，并继承原位置、朝向与姿势", () => {
  const layout = catLayout(1000, 460);
  const modes = ["auto", "run", "jump", "rest", "tail"];
  for (const mode of modes) {
    const sequence = createCatSequence(mode, layout);
    for (let time = 0; time < sequence.duration * 2 + 1; time += 0.073) {
      const at = nextCatSwitchTime(sequence, time);
      assert.ok(at >= time - 1e-8, "排队不能倒退时间");
      const checkpoint = sampleCatSequence(sequence, at);
      assert.ok(checkpoint.safe, `${mode} ${time} 切在不安全姿势`);
      assert.equal(checkpoint.lift, 0);
      for (const next of modes) {
        const first = sampleCatSequence(createCatSequence(next, layout, checkpoint), 0);
        for (const key of ["x", "direction", "sheet", "frame", "study", "tailWeight"])
          assert.equal(first[key], checkpoint[key], `${mode} → ${next} 的 ${key} 没有接上`);
      }
    }
  }
});

test("ADR-0008：空中切换必须完成落地恢复；自动演示回场只执行一次", () => {
  const layout = catLayout(1000, 460);
  const jump = createCatSequence("jump", layout);
  let flightStart = 0;
  for (const segment of jump.segments) {
    if (segment.kind === "flight") break;
    flightStart += segment.duration;
  }
  const airborne = flightStart + 0.3;
  const at = nextCatSwitchTime(jump, airborne);
  assert.ok(at >= flightStart + 0.86 + 0.12 + 0.48 - 1e-8);
  assert.equal(sampleCatSequence(jump, at).posture, "stand");
  assert.throws(
    () => createCatSequence("rest", layout, sampleCatSequence(jump, airborne)),
    /坐稳或站稳/,
  );

  const auto = createCatSequence("auto", layout, { x: 0.65, direction: -1, posture: "stand" });
  assert.ok(auto.loopStart > 0);
  assert.equal(sampleCatSequence(auto, 0).x, 0.65);
  const start = sampleCatSequence(auto, auto.loopStart);
  for (const loops of [1, 2, 10]) {
    const elapsed = auto.loopStart + (auto.duration - auto.loopStart) * loops;
    assert.ok(Math.abs(catSequenceTime(auto, elapsed) - auto.loopStart) < 1e-8);
    const pose = sampleCatSequence(auto, elapsed);
    for (const key of ["x", "direction", "sheet", "frame"]) assert.equal(pose[key], start[key]);
  }
});

test("关节辅助线跟随图集帧、左右镜像和离地位移，不改变标注原数据", () => {
  const layout = catLayout(1000, 460);
  const original = JSON.stringify(CAT_SKELETONS);
  for (const sheet of Object.keys(CAT_ATLASES)) {
    assert.equal(CAT_SKELETONS[sheet].length, CAT_ATLASES[sheet].frames.length);
    for (let frame = 0; frame < 8; frame++) {
      const motion = { sheet, frame, x: 0.3, lift: 0.4, direction: 1 };
      const forward = catPoseTransform(layout, motion);
      const backward = catPoseTransform(layout, { ...motion, direction: -1 });
      assert.deepEqual(projectCatPoint(forward.anchor, forward), forward.origin);
      for (const chain of Object.values(catSkeleton(motion, 1, 0.6))) {
        assert.equal(chain.length, 4);
        for (const point of chain) {
          const [rightX, rightY] = projectCatPoint(point, forward);
          const [leftX, leftY] = projectCatPoint(point, backward);
          assert.ok(Math.abs((rightX + leftX) / 2 - forward.origin[0]) < 1e-8);
          assert.equal(rightY, leftY);
          const grounded = projectCatPoint(point, catPoseTransform(layout, { ...motion, lift: 0 }));
          assert.ok(Math.abs(grounded[1] - rightY - layout.unit * 0.4) < 1e-8);
        }
      }
    }
  }
  assert.notDeepEqual(
    catSkeleton({ sheet: "run", frame: 0 }, 0, 1).front,
    catSkeleton({ sheet: "run", frame: 2 }, 0, 1).front,
  );
  assert.equal(JSON.stringify(CAT_SKELETONS), original);
});

test("坐姿尾巴标记使用实际网格变形，尾根不动，躯干标记不被带动", () => {
  const motion = { sheet: "idle", x: 0, direction: -1, lift: 0 };
  const rest = catSkeleton(motion, 1.5, 0);
  const moving = catSkeleton(motion, 1.5, 1);
  assert.deepEqual(rest.body, moving.body);
  assert.deepEqual(rest.tail[0], moving.tail[0]);
  assert.notDeepEqual(rest.tail.at(-1), moving.tail.at(-1));
  rest.tail.forEach(([x, y], i) => assert.deepEqual(moving.tail[i], deformTailPoint(x, y, 1.5, 1)));
  for (const tailStudy of [false, true]) {
    const transform = catPoseTransform(catLayout(375, 380), motion, tailStudy);
    assert.equal(transform.direction, -1, "坐姿图片和辅助线一起镜像，保留落地朝向");
    assert.deepEqual(projectCatPoint(transform.anchor, transform), transform.origin);
  }
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
    CAT_SKELETONS[name].forEach((skeleton, frame) => {
      const [sx, sy] = atlas.frames[frame].rect;
      // Occluded-side chains are explicitly estimates; visible markers must sit on the artwork.
      for (const chain of ["body", "front", "rear", "tail"])
        for (const [x, y] of skeleton[chain])
          assert.ok(
            data[((sy + y) * info.width + sx + x) * 4 + 3] > 128,
            `${name} 姿势 ${frame + 1} 的 ${chain} 标记落到了透明区域`,
          );
    });
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
