/**
 * @purpose 统一花草网格与蝴蝶停驻点的风动计算
 * @role 渲染和接触定位共享的纯几何函数
 * @deps 无；调用方提供植物尺寸、相位与硬度
 * @gotcha 网格内部为分段线性插值，不能直接把连续二次曲线当花头坐标
 */
export const MEADOW_ROWS = 9;
export function meadowBend(plant, time, wind) {
  const breeze =
    Math.sin(time * 1.08 + plant.phase) * 0.8 + Math.sin(time * 1.93 + plant.phase * 1.4) * 0.2;
  return breeze * wind * plant.height * 0.1 * plant.stiffness;
}
export function meadowPoint(plant, u, v, time, wind) {
  const rows = MEADOW_ROWS - 1,
    row = Math.min(rows - 1, Math.floor(v * rows)),
    f = v * rows - row;
  const influence = (1 - row / rows) ** 2 * (1 - f) + (1 - (row + 1) / rows) ** 2 * f;
  return [
    plant.x +
      (u - 0.5) * plant.height * plant.asset.aspect +
      meadowBend(plant, time, wind) * influence,
    plant.base - plant.height + v * plant.height,
  ];
}
