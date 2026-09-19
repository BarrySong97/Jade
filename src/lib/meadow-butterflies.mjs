/**
 * @purpose 为首页的杏黄和蓝紫蝴蝶安排独立飞行、落花和起飞
 * @role 不含猫或 demo 控件的可采样纯动画，静止/暂停共用同一时间
 * @deps meadow-wind.mjs；原花草素材的 alpha 裁切坐标
 * @gotcha 飞行用全局时间避免循环瞬移；选花只在布局时排序，落花后与真实网格同动
 */
import { meadowPoint } from "./meadow-wind.mjs";
export const MEADOW_FLOWER_CONTACTS = {
  "flower-daisy": [0.663, 0.206],
  "flower-yellow": [0.551, 0.153],
};
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const mix = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);

export function meadowFlowerPoint(plant, time, wind) {
  const [x, y] = MEADOW_FLOWER_CONTACTS[plant.asset.id],
    [left, top, width, height] = plant.asset.crop;
  const u = (x - left) / width,
    v = (y - top) / height;
  return meadowPoint(plant, plant.flip ? 1 - u : u, v, time, wind);
}

export function meadowButterflyLayout(width, height, plants) {
  const span = Math.max(1, Math.min(34, height * 0.16, width * 0.085));
  const margin = span * 0.8 + 8;
  const candidates = plants
    .filter((plant) => {
      if (!MEADOW_FLOWER_CONTACTS[plant.asset.id]) return false;
      const [x, y] = meadowFlowerPoint(plant, 0, 0);
      return x > margin && x < width - margin && y > span && y < height - span * 0.9;
    })
    .sort((a, b) => a.x - b.x);
  const split = Math.ceil(candidates.length / 2);
  return {
    width,
    height,
    span,
    butterflies: ["amber", "blue"].map((color, index) => {
      const center = width * (index ? 0.65 : 0.35);
      const flowers = (index ? candidates.slice(split) : candidates.slice(0, split))
        .sort((a, b) => Math.abs(a.x - center) - Math.abs(b.x - center))
        .slice(0, 5);
      return {
        color,
        index,
        span: span * (index ? 0.92 : 1),
        period: index ? 37 : 29,
        offset: index ? 11 : 0,
        flowers,
      };
    }),
  };
}

export function sampleMeadowButterfly(layout, index, time, wind = 0.45) {
  const fly = layout.butterflies[index],
    t = Math.max(0, time),
    clock = t + fly.offset;
  const local = clock % fly.period,
    cycle = Math.floor(clock / fly.period);
  const span = fly.span,
    margin = layout.span * 0.8 + 8;
  const center = layout.width * (index ? 0.64 : 0.36);
  const radius = Math.max(0, Math.min(center - margin, layout.width - margin - center));
  const phase = t * (index ? 0.23 : 0.19) + (index ? 2.2 : 0.1);
  const air = [
    center + radius * (0.78 * Math.sin(phase) + 0.12 * Math.sin(phase * 2.3 + 0.4)),
    clamp(
      layout.height * (index ? 0.41 : 0.32) + layout.height * 0.13 * Math.sin(phase * 1.7 + index),
      span,
      layout.height - span,
    ),
  ];
  const pose = {
    id: `${fly.color}-wing`,
    frame: Math.floor((clock / (index ? 0.36 : 0.32)) * 8) % 8,
    span,
    x: air[0],
    y: air[1],
    angle: 0.18 * Math.cos(phase),
    state: "flying",
    flower: null,
  };
  if (!fly.flowers.length) return pose;
  const flower = fly.flowers[(cycle + index) % fly.flowers.length];
  const contact = meadowFlowerPoint(flower, t, wind);
  const approach = fly.period - 7.8,
    land = approach + 1.45,
    rest = approach + 2,
    leave = fly.period - 1.8,
    end = leave + 1.4;
  if (local >= approach && local < rest) {
    const p = (local - approach) / (rest - approach),
      amount = ease(p);
    pose.x = mix(air[0], contact[0], amount);
    pose.y = mix(air[1], contact[1], amount) - span * 0.5 * Math.sin(Math.PI * p) ** 2;
    pose.angle *= 1 - amount;
    pose.state = "approaching";
    if (local >= land) {
      pose.id = `${fly.color}-perch`;
      pose.frame = Math.min(3, Math.floor(((local - land) / (rest - land)) * 4));
      pose.state = "landing";
    }
    pose.flower = flower;
  } else if (local >= rest && local < leave) {
    [pose.x, pose.y] = contact;
    pose.id = `${fly.color}-perch`;
    pose.frame = 3;
    pose.angle = 0;
    pose.state = "perched";
    pose.flower = flower;
  } else if (local >= leave && local < end) {
    const p = (local - leave) / (end - leave),
      amount = ease(p),
      arc = Math.sin(Math.PI * p) ** 2;
    pose.x = mix(contact[0], air[0], amount);
    pose.y = mix(contact[1], air[1], amount) - span * 0.6 * arc;
    pose.angle *= amount;
    pose.state = "departing";
    pose.flower = flower;
    if (local < leave + 0.36) {
      pose.id = `${fly.color}-perch`;
      pose.frame = [3, 5, 6, 7][Math.min(3, Math.floor(((local - leave) / 0.36) * 4))];
    }
  }
  return pose;
}
