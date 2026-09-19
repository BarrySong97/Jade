/**
 * @purpose 验证追蝶的因果时序、落花贴合、跨阶段连续和真实素材范围
 * @role pnpm test:meadow 的完整草丛场景回归，执行 ADR-0009
 * @deps node:test、node:assert、sharp、chase 纯函数与原始 PNG
 * @gotcha 用真实透明轮廓检查裁切/遮挡；数据通过不能代替浏览器实屏与动作审美验收
 */
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { MEADOW_ASSET_IDS, arrangeNaturalMeadow } from "../src/lib/meadow-layout.mjs";
import {
  CHASE_ATLASES,
  spriteTransform,
  projectSprite,
} from "../examples/meadow/chase/chase-assets.mjs";
import {
  chaseLayout,
  flowerPoint,
  flowerUV,
  plantPoint,
  FLOWER_CONTACTS,
  catGroundShadow,
} from "../examples/meadow/chase/chase-layout.mjs";
import {
  createChaseStory,
  sampleChase,
  locateChase,
  escapeTime,
  remapChaseTime,
} from "../examples/meadow/chase/chase-motion.mjs";

const base = new URL("../examples/meadow/", import.meta.url);
async function decode(path) {
  const { data, info } = await sharp(new URL(path, base).pathname)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alpha = (x, y) =>
    x < 0 || x >= info.width || y < 0 || y >= info.height
      ? 0
      : data[(Math.floor(y) * info.width + Math.floor(x)) * 4 + 3];
  return { data, width: info.width, height: info.height, alpha };
}
const sources = Promise.all(
  MEADOW_ASSET_IDS.map(async (id) => {
    const raw = await decode(`assets/${id}.png`);
    let left = raw.width,
      top = raw.height,
      right = 0,
      bottom = 0;
    for (let y = 0; y < raw.height; y++)
      for (let x = 0; x < raw.width; x++)
        if (raw.alpha(x, y) > 8) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    return [
      id,
      {
        id,
        raw,
        crop: [
          left / raw.width,
          top / raw.height,
          (right - left + 1) / raw.width,
          (bottom - top + 1) / raw.height,
        ],
        aspect: (right - left + 1) / (bottom - top + 1),
      },
    ];
  }),
).then(Object.fromEntries);
const atlases = Promise.all(
  Object.entries(CHASE_ATLASES).map(async ([id, atlas]) => {
    const raw = await decode(atlas.file.slice(1));
    const boxes = atlas.frames.map(({ rect: [sx, sy, w, h] }) => {
      const box = { left: w, top: h, right: 0, bottom: 0, solid: 0, clear: 0 };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const a = raw.alpha(sx + x, sy + y);
          if (a === 0) box.clear++;
          if (a > 240) box.solid++;
          if (a > 128) {
            box.left = Math.min(box.left, x);
            box.top = Math.min(box.top, y);
            box.right = Math.max(box.right, x);
            box.bottom = Math.max(box.bottom, y);
          }
        }
      return box;
    });
    return [id, { raw, boxes }];
  }),
).then(Object.fromEntries);

test("新增伏低、跑扑和停驻图集有真实 alpha、完整主体及安全间隔", async () => {
  const all = await atlases;
  for (const id of ["stalk", "dash", "perch"]) {
    const { raw, boxes } = all[id];
    assert.equal(raw.width, 1774);
    assert.equal(raw.height, 887);
    boxes.forEach((b, i) => {
      const [, , w, h] = CHASE_ATLASES[id].frames[i].rect;
      assert.ok(b.clear > w * h * 0.65 && b.solid > 15000, `${id}/${i} 需透明背景和完整主体`);
      assert.ok(
        b.left > 20 && b.top > 20 && b.right < w - 20 && b.bottom < h - 20,
        `${id}/${i} 不能串帧`,
      );
    });
  }
  const stalk = all.stalk.boxes;
  assert.ok(
    stalk[3].bottom - stalk[3].top < (stalk[0].bottom - stalk[0].top) * 0.65,
    "伏低必须改变体态",
  );
  assert.ok(
    stalk[7].bottom - stalk[7].top > stalk[3].bottom - stalk[3].top + 40,
    "探头需要抬起头部",
  );
  assert.ok(
    all.perch.boxes[0].right - all.perch.boxes[0].left >
      (all.perch.boxes[3].right - all.perch.boxes[3].left) * 2.5,
  );
});

test("ADR-0009：落花后伏低等待 1–2 秒，起跑直接接扑跳，猫靠近才逃离", async () => {
  const layout = chaseLayout(1327, 340, await sources);
  const story = createChaseStory(layout);
  for (const round of story.rounds) {
    assert.ok(round.focus.duration >= 1 && round.focus.duration <= 2);
    assert.equal(round.focus.start, round.dock.start + round.dock.duration);
    const escape = escapeTime(round, layout, round.start);
    assert.ok(escape > round.dash.start && escape < round.flight.start + round.flight.duration);
    for (let t = round.focus.start; t < round.dash.start; t += 0.07) {
      const m = sampleChase(story, round.start + t);
      assert.equal(m.cat.sheet, "stalk");
      assert.equal(m.cat.frame, 7);
      assert.equal(m.butterfly.state, "perched");
    }
    const kinds = round.segments.map((s) => s.kind);
    assert.deepEqual(kinds.slice(kinds.indexOf("dash"), kinds.indexOf("land") + 1), [
      "dash",
      "run",
      "takeoff",
      "flight",
      "land",
    ]);
    const before = sampleChase(story, round.start + escape - 0.001);
    const after = sampleChase(story, round.start + escape + 0.001);
    assert.equal(before.butterfly.state, "perched");
    assert.equal(after.butterfly.state, "evading");
    const distance =
      (flowerPoint(round.flower, round.start + escape)[0] -
        sampleChase(story, round.start + escape).cat.x) *
      round.direction;
    assert.ok(Math.abs(distance - layout.unit) < 0.001, "由接近距离触发，不能独立倒计时");
  }
});

test("停驻点位于原图花瓣，镜像与风动使用真实网格插值，株数不增加", async () => {
  const byId = await sources;
  const layout = chaseLayout(1327, 340, byId);
  assert.equal(layout.plants.length, arrangeNaturalMeadow({ seed: 5.6 }, 1327, 340, byId).length);
  const story = createChaseStory(layout);
  for (const round of story.rounds) {
    const flower = round.flower;
    const [ox, oy] = FLOWER_CONTACTS[flower.asset.id];
    assert.ok(
      flower.asset.raw.alpha(ox * flower.asset.raw.width, oy * flower.asset.raw.height) > 128,
    );
    const [u, v] = flowerUV(flower);
    const row = Math.floor(v * 8),
      f = v * 8 - row;
    for (const t of [
      round.start + round.focus.start + 0.2,
      round.start + round.focus.start + 0.9,
    ]) {
      const top = plantPoint(flower, u, row / 8, t),
        bottom = plantPoint(flower, u, (row + 1) / 8, t);
      const contact = flowerPoint(flower, t);
      for (const axis of [0, 1])
        assert.ok(Math.abs(contact[axis] - (top[axis] * (1 - f) + bottom[axis] * f)) < 1e-8);
      const butterfly = sampleChase(story, t).butterfly;
      assert.deepEqual([butterfly.x, butterfly.y], contact);
      const transform = spriteTransform(butterfly, layout.unit);
      assert.deepEqual(projectSprite(transform.anchor, transform), contact);
    }
  }
});

test("所有阶段及循环位置连续，跑扑不中断速度；缩放保留同一轮同一阶段", async () => {
  const byId = await sources;
  const story = createChaseStory(chaseLayout(1327, 340, byId));
  const next = createChaseStory(chaseLayout(335, 300, byId));
  for (const round of story.rounds) {
    const times = round.segments.map((s) => round.start + s.start);
    const trigger = round.start + escapeTime(round, story.layout, round.start);
    times.push(trigger, trigger + 1.15, round.start + round.duration);
    for (const time of times.filter((t) => t > 0)) {
      const a = sampleChase(story, time - 1e-5),
        b = sampleChase(story, time + 1e-5);
      assert.ok(Math.abs(a.butterfly.angle - b.butterfly.angle) < 0.001, "蝴蝶绕开后不能突然转向");
      for (const who of ["cat", "butterfly"])
        for (const axis of ["x", "y"])
          assert.ok(Math.abs(a[who][axis] - b[who][axis]) < 0.01, `${time} ${who}.${axis} 瞬移`);
    }
    const takeoff = round.segments.find((s) => s.kind === "takeoff");
    const t = round.start + takeoff.start,
      eps = 1e-4;
    const a = sampleChase(story, t - eps).cat.x,
      b = sampleChase(story, t).cat.x,
      c = sampleChase(story, t + eps).cat.x;
    assert.ok(Math.abs((b - a) / eps - (c - b) / eps) < 0.01, "起跳不能站定再平移");
    for (const segment of round.segments) {
      const time = story.duration * 2 + round.start + segment.start + segment.duration * 0.4;
      const moved = locateChase(next, remapChaseTime(story, next, time));
      assert.equal(moved.round.index, round.index);
      assert.equal(moved.segment.kind, segment.kind);
      assert.ok(Math.abs(moved.progress - 0.4) < 1e-8);
    }
  }
});

test("猫只允许脚底埋入底边草根，头身/蝴蝶不裁切，回草丛不倒着滑行", async () => {
  const [byId, all] = await Promise.all([sources, atlases]);
  for (const width of [240, 280, 335, 375, 640, 1327]) {
    const layout = chaseLayout(width, width < 640 ? 300 : 340, byId),
      story = createChaseStory(layout);
    for (let t = 0; t < story.duration; t += 0.033) {
      const m = sampleChase(story, t);
      for (const pose of [m.cat, m.butterfly]) {
        const b = all[pose.sheet].boxes[pose.frame],
          transform = spriteTransform(pose, layout.unit);
        for (const x of [b.left, b.right])
          for (const y of [b.top, b.bottom]) {
            const p = projectSprite([x, y], transform);
            const floor = pose.butterfly ? layout.height : layout.ground;
            assert.ok(
              p[0] >= 0 && p[0] <= width && p[1] >= 0 && p[1] <= floor + 1e-8,
              `${width}px ${t.toFixed(2)}s ${pose.sheet}/${pose.frame} 裁切 ${p}`,
            );
            if (!pose.butterfly && y === b.top)
              assert.ok(p[1] < layout.height - layout.unit * 0.45, "头身不能随埋脚一起藏出画布");
          }
      }
      if (m.segment.kind === "return")
        assert.ok((m.segment.to - m.segment.from) * m.cat.direction > 0, "回草丛必须沿朝向前进");
    }
  }
});

test("ADR-0009：真实落脚帧贴住草根地面，阴影留在地面且腾空变淡", async () => {
  const [byId, all] = await Promise.all([sources, atlases]);
  for (const width of [335, 1327]) {
    const layout = chaseLayout(width, width < 640 ? 300 : 340, byId);
    assert.ok(
      layout.ground >= layout.height && layout.ground <= layout.height + layout.unit * 0.15,
      "脚底线需落在底边草根内，不能踩在草叶上",
    );
    for (const [sheet, frames] of Object.entries({
      run: [0, 1, 3, 6, 7],
      jump: [0, 6],
      stalk: [1, 2, 3, 4, 5, 6, 7],
      dash: [1, 2, 5],
      gait: [1, 2, 5, 6],
      prepare: [5, 6],
      turn: [1, 2, 3, 4, 5, 6],
    })) {
      for (const frame of frames) {
        const pose = { sheet, frame, x: width / 2, y: layout.ground, direction: 1 };
        const point = projectSprite(
          [220, all[sheet].boxes[frame].bottom],
          spriteTransform(pose, layout.unit),
        );
        assert.ok(Math.abs(point[1] - layout.ground) < 0.6, `${sheet}/${frame} 的实际脚底悬空`);
      }
    }
    const cat = { x: width / 2, y: layout.ground, direction: 1 };
    const contact = catGroundShadow(layout, cat);
    const airborne = catGroundShadow(layout, { ...cat, y: layout.ground - layout.unit * 0.8 });
    assert.equal(contact.y, airborne.y, "影子不能跟猫一起浮起来");
    assert.ok(contact.y - contact.radiusY < layout.height, "贴地阴影需部分留在可见区域");
    assert.ok(airborne.opacity < contact.opacity * 0.6);
  }
});

test("前景草真正遮住一部分伏低猫，仍留出可见轮廓", async (t) => {
  const [byId, all] = await Promise.all([sources, atlases]);
  for (const width of [335, 1327]) {
    const layout = chaseLayout(width, width < 640 ? 300 : 340, byId),
      story = createChaseStory(layout);
    for (const round of story.rounds.slice(0, 2)) {
      const time = round.start + round.focus.start + 0.5;
      const pose = sampleChase(story, time).cat;
      const atlas = CHASE_ATLASES[pose.sheet],
        raw = all[pose.sheet].raw;
      const transform = spriteTransform(pose, layout.unit),
        [sx, sy, w, h] = atlas.frames[pose.frame].rect;
      let total = 0,
        covered = 0;
      for (let y = 0; y < h; y += 7)
        for (let x = 0; x < w; x += 7) {
          if (raw.alpha(sx + x, sy + y) < 200) continue;
          total++;
          const point = projectSprite([x, y], transform);
          const occluded = layout.plants.some((plant) => {
            if (plant.layer !== 3) return false;
            const v = (point[1] - (plant.base - plant.height)) / plant.height;
            if (v < 0 || v > 1) return false;
            const left = plantPoint(plant, 0, v, time)[0];
            let u = (point[0] - left) / (plant.height * plant.asset.aspect);
            if (u < 0 || u > 1) return false;
            if (plant.flip) u = 1 - u;
            const [cx, cy, cw, ch] = plant.asset.crop,
              image = plant.asset.raw;
            return image.alpha((cx + u * cw) * image.width, (cy + v * ch) * image.height) > 160;
          });
          if (occluded) covered++;
        }
      const ratio = covered / total;
      t.diagnostic(
        `${width}px 第${round.index + 1}轮不透明前草覆盖猫轮廓 ${(ratio * 100).toFixed(1)}%`,
      );
      assert.ok(
        ratio > 0.12 && ratio < 0.8,
        `${width}px 第${round.index + 1}轮遮挡比例 ${(ratio * 100).toFixed(1)}%`,
      );
    }
  }
});
