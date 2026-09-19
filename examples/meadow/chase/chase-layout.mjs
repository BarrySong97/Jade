/**
 * @purpose 安排藏身草叶、停驻花头，并按真实网格投影接触点
 * @role 原自然草甸到追蝶舞台的布局适配层
 * @deps meadow-layout.mjs；带 alpha 裁切信息的植物素材
 * @gotcha 只调整已有植物，不增加密度；花头风动按 9 行网格分段插值，避免足部漂移
 */
import { arrangeNaturalMeadow } from "../../../src/lib/meadow-layout.mjs";

export const FLOWER_CONTACTS = { "flower-daisy": [0.663, 0.206], "flower-yellow": [0.551, 0.153] };
export const CHASE_WIND = 0.32;

export function flowerUV(plant) {
  const [x, y] = FLOWER_CONTACTS[plant.asset.id];
  const [left, top, width, height] = plant.asset.crop;
  const u = (x - left) / width;
  return [plant.flip ? 1 - u : u, (y - top) / height];
}

export function plantPoint(plant, u, v, time, wind = CHASE_WIND) {
  const breeze =
    Math.sin(time * 1.08 + plant.phase) * 0.8 + Math.sin(time * 1.93 + plant.phase * 1.4) * 0.2;
  const bend = breeze * wind * plant.height * 0.1 * plant.stiffness;
  const row = Math.min(7, Math.floor(v * 8));
  const fraction = v * 8 - row;
  const influence = (1 - row / 8) ** 2 * (1 - fraction) + (1 - (row + 1) / 8) ** 2 * fraction;
  const width = plant.height * plant.asset.aspect;
  return [
    plant.x + (u - 0.5) * width + bend * influence,
    plant.base - plant.height + v * plant.height,
  ];
}

export function flowerPoint(plant, time, wind = CHASE_WIND) {
  return plantPoint(plant, ...flowerUV(plant), time, wind);
}

export function chaseLayout(width, height, byId) {
  const unit = Math.max(1, Math.min(96, width * 0.18, (height - 64) * 0.32));
  const half = Math.max(0, Math.min(width / 2 - unit * 1.2 - 8, unit * 2.75));
  const ground = height - 12;
  const homes = [width / 2 - half, width / 2 + half];
  const plants = arrangeNaturalMeadow({ seed: 5.6 }, width, height, byId).map((plant) => ({
    ...plant,
  }));
  const flowers = Object.keys(FLOWER_CONTACTS).map((id, i) => {
    const desiredX = width / 2 + (i === 0 ? 1 : -1) * Math.min(half * 0.16, unit * 0.3);
    const candidates = plants.filter((plant) => plant.asset.id === id);
    const flower = candidates.sort(
      (a, b) => Math.abs(a.x - desiredX) - Math.abs(b.x - desiredX),
    )[0];
    if (!flower) throw new Error(`场景缺少停驻花朵：${id}`);
    const [u, v] = flowerUV(flower);
    flower.base = height + 10;
    flower.height = (flower.base - ground + unit * (i === 0 ? 1.28 : 1.1)) / (1 - v);
    flower.x = desiredX - (u - 0.5) * flower.height * flower.asset.aspect;
    flower.stiffness = 0.5;
    return flower;
  });
  const front = plants.filter((plant) => plant.layer === 3);
  const used = new Set();
  for (const [i, home] of homes.entries()) {
    for (let j = 0; j < 2; j++) {
      const plant = front
        .filter((item) => !used.has(item))
        .sort((a, b) => Math.abs(a.x - home) - Math.abs(b.x - home))[0];
      if (!plant) continue;
      used.add(plant);
      plant.asset = byId[j ? "grass-wispy" : "grass-arching"];
      plant.x = home + (j ? 0.45 : -0.45) * unit;
      plant.height = unit * (j ? 1.22 : 1.04);
      plant.base = ground + 12;
      plant.flip = Boolean(i);
    }
  }
  // Keep the two readable landing flowers in front of other background plants.
  plants.sort(
    (a, b) => a.layer - b.layer || Number(flowers.includes(a)) - Number(flowers.includes(b)),
  );
  return { width, height, unit, half, ground, homes, flowers, plants, wind: CHASE_WIND };
}
