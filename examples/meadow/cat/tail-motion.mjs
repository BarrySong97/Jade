/**
 * @purpose 为坐姿小猫提供根部固定、带休息段的尾尖摆动
 * @role 独立 Canvas 实验的确定性动作函数
 * @deps 无；坐标使用原始 1254px PNG 画布
 * @gotcha x<=290 的连接区域始终不动；只改顶点，不能移动纹理坐标或身体
 */
export const CAT_SIZE = 1254;
export const TAIL_CYCLE = 6.8;
const ACTIVE_TIME = 4.6;

export function deformTailPoint(x, y, time, amplitude) {
  const strength = Math.max(0, Math.min(1, amplitude));
  const phase = ((time % TAIL_CYCLE) + TAIL_CYCLE) % TAIL_CYCLE;
  if (x <= 290 || strength === 0 || phase >= ACTIVE_TIME) return [x, y];
  const progress = phase / ACTIVE_TIME;
  const envelope = Math.sin(Math.PI * progress) ** 2;
  const distance = Math.max(0, Math.min(1, (x - 290) / 410));
  const weight = distance ** 2;
  const sway = Math.sin(progress * Math.PI * 2 - distance * 0.7);
  const lift = 0.75 + 0.25 * Math.sin(progress * Math.PI * 2 - distance * 0.9);
  return [
    x + 24 * strength * weight * envelope * sway,
    y - 110 * strength * weight * envelope * lift,
  ];
}
