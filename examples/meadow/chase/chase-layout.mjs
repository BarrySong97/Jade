/**
 * @purpose 安排草根地面、藏身草叶、接触阴影及随风停驻花头
 * @role 原自然草甸到追蝶舞台的布局适配层
 * @deps meadow-layout.mjs；带 alpha 裁切信息的植物素材
 * @gotcha 地面埋在底边草根内，允许脚尖被底边裁住；前草不随猫一起下移；花头按 9 行网格插值
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
  // The soil is behind the grass roots, not on top of the visible grass strip.
  const ground = height + unit * 0.12;
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
    const bloomY = height - 12 - unit * (i === 0 ? 1.28 : 1.1);
    flower.height = (flower.base - bloomY) / (1 - v);
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
      plant.base = height;
      plant.flip = Boolean(i);
    }
  }
  // Keep some low leaves in front along the route, not only at the two hiding spots.
  for (const [i, fraction] of [0.25, 0.5, 0.75].entries()) {
    const x = homes[0] + (homes[1] - homes[0]) * fraction;
    const plant = front
      .filter((item) => !used.has(item))
      .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    if (!plant) continue;
    used.add(plant);
    plant.asset = byId[i === 1 ? "grass-arching" : "grass-low"];
    plant.x = x;
    plant.height = unit * [0.78, 0.92, 0.84][i];
    plant.base = height + unit * 0.03;
  }
  // Keep the two readable landing flowers in front of other background plants.
  plants.sort(
    (a, b) => a.layer - b.layer || Number(flowers.includes(a)) - Number(flowers.includes(b)),
  );
  return { width, height, unit, half, ground, homes, flowers, plants, wind: CHASE_WIND };
}

export function catGroundShadow(layout, cat) {
  const lift = Math.max(0, Math.min(1, (layout.ground - cat.y) / layout.unit));
  return {
    x: cat.x - cat.direction * layout.unit * 0.08,
    y: layout.ground - layout.unit * 0.09,
    radiusX: layout.unit * (0.8 + lift * 0.16),
    radiusY: layout.unit * (0.12 + lift * 0.03),
    opacity: 0.18 * (1 - lift * 0.65),
  };
}
