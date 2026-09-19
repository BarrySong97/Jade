/**
 * @purpose 定义蝴蝶振翅图集、连续飞行路线与原地观察过渡
 * @role 独立于 DOM 的可采样动画数据，供原花草 demo 与回归使用
 * @deps butterfly-wingbeat-v1.png（1774 × 887，4 列 2 行）
 * @gotcha 按身体注册点对齐且全图集统一比例；切模式不重置振翅或飞行时间
 */
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const mix = (a, b, t) => a + (b - a) * t;
export const WINGBEAT_SECONDS = 0.32;
export const FLIGHT_SECONDS = 16;
export const BUTTERFLY_ATLAS = {
  file: "butterfly-wingbeat-v1.png",
  width: 1774,
  height: 887,
  span: 336,
  frames: [
    [236, 285],
    [237, 285],
    [232, 285],
    [222, 285],
    [237, 238],
    [237, 238],
    [235, 238],
    [224, 240],
  ].map((anchor, index) => {
    const x = Math.round((index % 4) * 443.5);
    const y = Math.round(Math.floor(index / 4) * 443.5);
    return {
      anchor,
      rect: [
        x,
        y,
        Math.round(((index % 4) + 1) * 443.5) - x,
        Math.round((Math.floor(index / 4) + 1) * 443.5) - y,
      ],
    };
  }),
};

export function butterflyLayout(width, height) {
  const flightSpan = Math.max(1, Math.min(94, width * 0.24, (height - 48) * 0.4));
  return {
    width,
    height,
    flightSpan,
    studySpan: Math.max(1, Math.min(180, width - 72, (height - 72) * 0.95)),
    radiusX: Math.max(0, width / 2 - flightSpan * 0.7 - 20),
    radiusY: Math.max(0, height / 2 - flightSpan * 0.7 - 24),
  };
}

export function butterflyFlightPoint(time, layout) {
  const phase = (Math.max(0, time) / FLIGHT_SECONDS) * Math.PI * 2;
  const horizontal = 0.78 * Math.sin(phase) + 0.16 * Math.sin(phase * 2 + 0.65);
  const vertical = 0.62 * Math.sin(phase * 2 + 0.4) + 0.18 * Math.sin(phase * 3 - 1.2);
  const dx =
    (layout.radiusX * (0.78 * Math.cos(phase) + 0.32 * Math.cos(phase * 2 + 0.65)) * Math.PI * 2) /
    FLIGHT_SECONDS;
  return {
    x: layout.width / 2 + layout.radiusX * horizontal,
    y: layout.height / 2 + layout.radiusY * vertical,
    angle: 0.28 * Math.tanh(dx / 25) + 0.06 * Math.sin(phase * 2),
  };
}

export function butterflyFocus(transition, time) {
  const progress = clamp((time - transition.at) / 0.65, 0, 1);
  return mix(transition.from, transition.to, progress * progress * (3 - 2 * progress));
}

export function sampleButterfly(time, layout, focus = 0) {
  const flight = butterflyFlightPoint(time, layout);
  const amount = clamp(focus, 0, 1);
  return {
    frame: Math.floor((Math.max(0, time) / WINGBEAT_SECONDS) * 8 + 1e-9) % 8,
    x: mix(flight.x, layout.width / 2, amount),
    y: mix(flight.y, layout.height / 2, amount),
    angle: flight.angle * (1 - amount),
    span: mix(layout.flightSpan, layout.studySpan, amount),
    focus: amount,
  };
}

export function projectButterflyPoint([x, y], pose) {
  const [anchorX, anchorY] = BUTTERFLY_ATLAS.frames[pose.frame].anchor;
  const scale = pose.span / BUTTERFLY_ATLAS.span;
  const dx = (x - anchorX) * scale;
  const dy = (y - anchorY) * scale;
  return [
    pose.x + dx * Math.cos(pose.angle) - dy * Math.sin(pose.angle),
    pose.y + dx * Math.sin(pose.angle) + dy * Math.cos(pose.angle),
  ];
}
