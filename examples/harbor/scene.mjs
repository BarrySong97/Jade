/**
 * @purpose 海港 Demo 的航行、海鸥图集与响应式几何
 * @role 无 DOM 的可采样动画数据，支持暂停、拖动和回归
 * @deps 五张 ImageGen 原画，素材来源见 prompts*.json
 * @gotcha 通栏海面中段延展，两岸保持等比小尺寸；底边裁掉原画透明收边；船只在透明阶段重置
 */
export const VOYAGE_SECONDS = 64;
export const ASSET_NAMES = [
  "industrial-harbor-v1",
  "industrial-boat-v1",
  "gull-wingbeat-v2",
  "industrial-yard-v1",
  "industrial-workers-v1",
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
  const plateWidth = w;
  const artWidth = Math.min(w, 660, h * 3);
  return {
    width: w,
    height: h,
    plateWidth,
    artWidth,
    plateHeight: artWidth / 3,
    left: 0,
    top: h - (artWidth / 3) * 0.9,
    boatWidth: clamp(artWidth * 0.1, 24, 66),
  };
}

export function sampleBoat(time, layout) {
  const phase = phaseAt(time);
  const p = clamp((phase - 2) / 52);
  // 水平直航：水线、船体大小固定，不再向右上远海缩小。
  const x = mix(layout.artWidth * 0.36, layout.width - layout.boatWidth * 0.6, p);
  return {
    x,
    y: layout.top + 0.805 * layout.plateHeight,
    width: layout.boatWidth,
    angle: 0,
    opacity: smooth(phase / 1.8) * (1 - smooth((phase - 47) / 8)),
    progress: p,
    stage: phase < 9 ? "离开港口" : phase < 55 ? "向右直航" : "海风稍歇",
  };
}

export function shipyardLayout(layout) {
  const width = layout.artWidth * 0.18;
  return {
    x: layout.artWidth * 0.035,
    y: layout.top + layout.plateHeight * 0.49,
    width,
    height: (width * 2) / 3,
  };
}

export function sampleWorker(time, index, yard) {
  // 携工具走到作业点，停下施工，再走回；折返只在静止段发生。
  const duration = 18 + index * 2;
  const cycle = (((time + index * 5.1) % duration) + duration) % duration;
  const a = [0.17, 0.37, 0.58][index];
  const b = [0.4, 0.64, 0.82][index];
  const outbound = cycle < 5;
  const working = cycle >= 5 && cycle < 10;
  const returning = cycle >= 10 && cycle < 15;
  const walking = outbound || returning;
  const progress = outbound
    ? smooth(cycle / 5)
    : returning
      ? 1 - smooth((cycle - 10) / 5)
      : working
        ? 1
        : 0;
  const frame = walking
    ? Math.floor(cycle * 5) % 4
    : working
      ? 5 + (Math.floor(cycle * 2.5) % 2)
      : 7;
  return {
    x: yard.x + yard.width * mix(a, b, progress),
    y: yard.y + yard.height * (0.59 + mix(a, b, progress) * 0.2 + index * 0.015),
    height: yard.width * 0.2,
    frame,
    direction: returning || cycle >= 15 ? -1 : 1,
    walking,
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
  const span = clamp(layout.artWidth * (0.029 - index * 0.004), 9 - index, 20);
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
