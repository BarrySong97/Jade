/**
 * @purpose 编排猫的观察、跑动、蓄力、腾空和落地
 * @role 独立动画板可复现的动作与地面轨迹
 * @deps 无；renderer 按姿势索引采样 PNG 图集
 * @gotcha 跑步节奏跟随行进距离；跳跃仅在飞行阶段离地；单次动作结束保持最终位置
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

export function catLayout(width, height) {
  const unit = Math.max(1, Math.min(172, height * 0.39, width * 0.31));
  // The widest full-body pose occupies at most 2.05 units around its ground anchor.
  const travel = Math.max(0, Math.min(unit * 2.1, (width - unit * 2.05 - 32) / 2));
  return { width, height, unit, travel, ground: height - 44 };
}

export function createCatSequence(mode, layout, start = { x: 0, direction: 1 }) {
  const segments = [];
  let x = mode === "auto" ? -0.72 : clamp(start.x, -0.8, 0.8);
  let direction = start.direction === -1 ? -1 : 1;
  const add = (kind, duration, to = x, facing = direction) => {
    segments.push({ kind, duration, from: x, to, direction: facing });
    x = to;
    direction = facing;
  };
  const run = (to) => {
    const distance = Math.abs(to - x) * layout.travel;
    add("run", Math.max(0.64, (distance / layout.unit) * 0.72), to, to >= x ? 1 : -1);
  };
  const jump = (to) => {
    add("crouch", 0.3);
    add("push", 0.12);
    add("flight", 0.86, to);
    add("land", 0.2);
    add("recover", 0.3);
  };

  if (mode === "auto") {
    add("sit", 1.8, x, 1);
    add("stand", 0.2);
    run(0.36);
    add("stand", 0.18);
    jump(0.76);
    add("stand", 0.6);
    add("sit", 3.8);
    add("stand", 0.24, x, -1);
    run(-0.72);
    add("stand", 0.3);
    add("sit", 5.4, x, 1);
  } else if (mode === "run") {
    const to = x > 0 ? -0.76 : 0.76;
    add("stand", 0.16, x, to > x ? 1 : -1);
    run(to);
    add("stand", 0.45);
    add("sit", 0.2);
  } else if (mode === "jump") {
    direction = x > 0.45 ? -1 : x < -0.45 ? 1 : direction;
    add("stand", 0.16);
    jump(clamp(x + direction * 0.4, -0.8, 0.8));
    add("sit", 0.2);
  } else {
    add("sit", 6.8, mode === "tail" ? 0 : x);
  }
  return {
    mode,
    segments,
    duration: segments.reduce((total, segment) => total + segment.duration, 0),
    loop: ["auto", "rest", "tail"].includes(mode),
    travel: layout.travel,
    unit: layout.unit,
  };
}

export function sampleCatSequence(sequence, elapsed) {
  const time = Math.max(0, elapsed);
  let local = sequence.loop ? time % sequence.duration : Math.min(time, sequence.duration);
  let segment = sequence.segments.at(-1);
  for (const candidate of sequence.segments) {
    segment = candidate;
    if (local < candidate.duration) break;
    local -= candidate.duration;
  }
  if (!sequence.loop && time >= sequence.duration) local = segment.duration;
  const p = clamp(local / segment.duration, 0, 1);
  const result = {
    kind: segment.kind,
    sheet: "jump",
    frame: 0,
    x: segment.from,
    direction: segment.direction,
    lift: 0,
    label: "站着观察",
    done: !sequence.loop && time >= sequence.duration,
  };
  if (segment.kind === "sit") {
    result.sheet = "idle";
    result.label = "坐下休息";
    result.x = segment.to;
  } else if (segment.kind === "run") {
    // Smooth acceleration/deceleration; gait advances by distance, not wall time.
    result.x = mix(segment.from, segment.to, ease(p));
    const distance = Math.abs(segment.to - segment.from) * sequence.travel;
    // A narrow board still shows a complete gait, with a shorter stride.
    const steps = ease(p) * Math.max(1, distance / sequence.unit);
    result.sheet = "run";
    result.frame = Math.floor(steps * 8) % 8;
    result.label = "小跑";
  } else if (segment.kind === "crouch") {
    result.frame = 1;
    result.label = "蹲低蓄力";
  } else if (segment.kind === "push") {
    result.frame = 2;
    result.label = "蹬地起跳";
  } else if (segment.kind === "flight") {
    result.frame = p < 0.28 ? 3 : p < 0.57 ? 4 : 5;
    result.x = mix(segment.from, segment.to, p);
    result.lift = 4 * p * (1 - p) * 0.74;
    result.label = p < 0.5 ? "跃起" : "准备落地";
  } else if (segment.kind === "land") {
    result.frame = 6;
    result.label = "落地缓冲";
  } else if (segment.kind === "recover") {
    result.frame = 7;
    result.label = "重新站稳";
  }
  return result;
}
