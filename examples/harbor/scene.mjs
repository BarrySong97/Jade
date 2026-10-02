/**
 * @purpose 海港 Demo 的航行、海鸥图集与响应式几何
 * @role 无 DOM 的可采样动画数据，支持暂停、拖动和回归
 * @deps 五张 ImageGen 原画，素材来源见 prompts*.json
 * @gotcha 船只在透明阶段回到港口；坐标基于完整 3:1 原画，窄屏不裁掉航线；图集用肩部注册点统一定位
 */
export const VOYAGE_SECONDS = 64;
export const ASSET_NAMES = [
  "harbor-v1",
  "boat-v1",
  "gull-wingbeat-v2",
  "shipyard-v1",
  "workers-v1",
];
export const GULL_ATLAS = {
  width: 1774,
  height: 887,
  anchors: [
    [240, 312],
    [249, 312],
    [253, 313],
    [248, 308],
    [246, 240],
    [253, 240],
    [251, 264],
    [265, 273],
  ],
};
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const phaseAt = (time) => ((time % VOYAGE_SECONDS) + VOYAGE_SECONDS) % VOYAGE_SECONDS;

export function sceneLayout(width, height) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const plateWidth = Math.min(w, h * 3);
  return {
    width: w,
    height: h,
    plateWidth,
    plateHeight: plateWidth / 3,
    left: (w - plateWidth) / 2,
    top: h - plateWidth / 3,
    boatWidth: clamp(plateWidth * 0.145, 64, 210),
  };
}

export function sampleBoat(time, layout) {
  const phase = phaseAt(time);
  const p = smooth((phase - 2) / 52);
  // 先从石堤前的泊位向右驶出，再渐渐远离到右上方的开阔海面。
  const x = mix(0.36, 0.82, p);
  const y = 0.805 - 0.265 * p * p;
  const scale = mix(1, 0.13, p);
  return {
    x: layout.left + x * layout.plateWidth,
    y: layout.top + y * layout.plateHeight + Math.sin(phase * 1.9) * scale * 0.8,
    width: layout.boatWidth * scale,
    angle: Math.sin(phase * 1.35) * 0.018 * scale,
    opacity: smooth(phase / 1.8) * (1 - smooth((phase - 47) / 8)),
    progress: p,
    stage: phase < 9 ? "离开港口" : phase < 35 ? "沿海航行" : phase < 55 ? "驶向远海" : "海风稍歇",
  };
}

export function shipyardLayout(layout) {
  const width = layout.plateWidth * 0.27;
  return {
    x: layout.left + layout.plateWidth * 0.015,
    y: layout.top + layout.plateHeight * 0.43,
    width,
    height: (width * 2) / 3,
  };
}

export function sampleWorker(time, index, yard) {
  // 三位工人错峰敲击、停顿；脚部锚点固定，避免整个人上下漂浮。
  const cycle = (time + index * 1.13) % 3.6;
  const sequence = [0, 1, 2, 1, 0, 1, 2, 3];
  return {
    x: yard.x + yard.width * [0.24, 0.51, 0.79][index],
    y: yard.y + yard.height * [0.61, 0.73, 0.72][index],
    height: yard.width * 0.24,
    frame: cycle < 2 ? sequence[Math.floor(cycle / 0.25)] : 3,
    direction: index === 2 ? -1 : 1,
  };
}

export function gullFrame(time) {
  const beat = ((time % 4.4) + 4.4) % 4.4;
  // 两次完整振翅后保持展翼滑翔，避免始终机械地拍打。
  return beat < 1.6 ? Math.floor((beat % 0.8) / 0.1) % 8 : 2;
}

export function sampleGull(time, index, layout) {
  const duration = 19 + index * 4;
  const cycle = ((time + index * 6.1) / duration) % 1;
  const theta = cycle * Math.PI * 2;
  const direction = index === 1 ? -1 : 1;
  const unitX = direction === 1 ? cycle : 1 - cycle;
  const span = clamp(layout.plateWidth * (0.034 - index * 0.005), 17 - index * 2, 46);
  return {
    x:
      layout.left +
      mix(
        Math.max(layout.plateWidth * 0.06, span + 2),
        Math.min(layout.plateWidth * 0.96, layout.plateWidth - span - 2),
        unitX,
      ),
    y: layout.top + layout.plateHeight * (0.34 - index * 0.075 + Math.sin(theta + index) * 0.065),
    span,
    direction,
    angle: Math.cos(theta + index) * 0.075,
    opacity: smooth(cycle / 0.1) * (1 - smooth((cycle - 0.9) / 0.1)) * (1 - index * 0.14),
    frame: gullFrame(time + index * 0.37),
  };
}

export function gullRect(frame) {
  const column = frame % 4;
  const row = Math.floor(frame / 4);
  const x = Math.round((column * GULL_ATLAS.width) / 4);
  const y = Math.round((row * GULL_ATLAS.height) / 2);
  return [
    x,
    y,
    Math.round(((column + 1) * GULL_ATLAS.width) / 4) - x,
    Math.round(((row + 1) * GULL_ATLAS.height) / 2) - y,
  ];
}
