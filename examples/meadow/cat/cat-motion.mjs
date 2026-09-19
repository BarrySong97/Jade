/**
 * @purpose 通过坐站、起跑/收步、下蹲/恢复和转身连接猫的动作
 * @role 独立 demo 的确定性时间线与安全动作切换
 * @deps 无；姿势引用由 cat-atlas.mjs 提供图片坐标
 * @gotcha 只在坐稳/站稳时切换请求；腾空必须完成落地；循环前缀只播放一次
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const idle = ["idle", 0];
const stand = ["jump", 0];
const contact = ["run", 0];
export const CAT_CLIPS = {
  rise: [idle, ...[1, 2, 3, 4, 5, 6].map((i) => ["rise", i]), stand],
  start: [stand, ["gait", 1], ["gait", 2], contact],
  brake: [contact, ["gait", 5], ["gait", 6], stand],
  crouch: [stand, ["prepare", 1], ["prepare", 2], ["jump", 1]],
  recover: [["jump", 6], ["prepare", 5], ["prepare", 6], stand],
  turn: [stand, ...[1, 2, 3, 4, 5, 6].map((i) => ["turn", i]), stand],
};
CAT_CLIPS.lower = [...CAT_CLIPS.rise].reverse();

export function catLayout(width, height) {
  const unit = Math.max(1, Math.min(172, height * 0.39, width * 0.31));
  const travel = Math.max(0, Math.min(unit * 2.1, (width - unit * 2.05 - 32) / 2));
  return { width, height, unit, travel, ground: height - 44 };
}

export function createCatSequence(mode, layout, start) {
  const segments = [];
  let x = clamp(start?.x ?? (mode === "auto" ? -0.72 : 0), -0.8, 0.8);
  let direction = start?.direction === -1 ? -1 : 1;
  let posture = start?.posture ?? "sit";
  let study = start?.study ?? 0;
  let tailWeight = start?.tailWeight ?? 1;
  let loopStart = 0;
  if (!["sit", "stand"].includes(posture)) throw new Error("动作必须在坐稳或站稳后衔接。");
  const length = () => segments.reduce((sum, segment) => sum + segment.duration, 0);
  const add = (kind, duration, to = x, extra = {}) => {
    segments.push({ kind, duration, from: x, to, direction, study, ...extra });
    x = to;
  };
  const standing = (duration = 0.16) => add("stand", duration, x, { safe: true, posture: "stand" });
  const seated = (duration) => {
    add("sit", duration, x, { safe: true, posture: "sit", tailFrom: tailWeight });
    tailWeight = 1;
  };
  const unfocus = () => {
    if (study > 0) {
      add("focus", 0.35, x, { studyFrom: study, studyTo: 0, tailFrom: tailWeight });
      tailWeight = 1;
    }
    study = 0;
  };
  const ensureStand = () => {
    unfocus();
    if (posture === "sit") {
      add("tail-settle", 0.24, x, { tailFrom: tailWeight });
      add("rise", 0.8);
      posture = "stand";
      tailWeight = 0;
    }
    standing();
  };
  const face = (desired) => {
    if (desired !== direction) {
      add("turn", 0.8, x, { endDirection: desired });
      direction = desired;
      standing();
    }
  };
  const sit = () => {
    if (posture === "stand") {
      add("lower", 0.8);
      posture = "sit";
      tailWeight = 0;
    }
  };
  const run = (to) => {
    const distance = Math.abs(to - x);
    if (distance < 0.0001) return;
    face(to > x ? 1 : -1);
    const cycles = Math.max(1, Math.ceil((distance * layout.travel) / layout.unit));
    const duration = cycles * 0.72;
    const acceleration = 0.42;
    const speed = (to - x) / (duration + acceleration);
    const lead = (speed * acceleration) / 2;
    add("start", acceleration, x + lead, { curve: "accelerate" });
    add("run", duration, to - lead, { cycles });
    add("brake", acceleration, to, { curve: "decelerate" });
    standing();
  };
  const jump = (to) => {
    add("crouch", 0.4);
    add("push", 0.12);
    add("flight", 0.86, to);
    add("land", 0.12);
    add("recover", 0.48);
    standing();
  };
  if (mode === "auto") {
    // Bring a user-requested auto sequence into its loop without resetting position or pose.
    if (Math.abs(x + 0.72) > 0.0001 || direction !== 1 || posture !== "sit" || study > 0) {
      ensureStand();
      run(-0.72);
      face(1);
      sit();
    }
    loopStart = length();
    seated(2.2);
    ensureStand();
    run(0.36);
    jump(0.76);
    sit();
    seated(5.6);
    ensureStand();
    run(-0.72);
    face(1);
    sit();
    seated(7.4);
  } else if (mode === "run") {
    ensureStand();
    run(x > 0 ? -0.76 : 0.76);
    sit();
    seated(0.35);
  } else if (mode === "jump") {
    ensureStand();
    face(x > 0.45 ? -1 : x < -0.45 ? 1 : direction);
    jump(clamp(x + direction * 0.4, -0.8, 0.8));
    sit();
    seated(0.35);
  } else {
    if (mode !== "tail") unfocus();
    sit();
    if (mode === "tail" && study < 1) {
      add("focus", 0.35, x, { studyFrom: study, studyTo: 1, tailFrom: tailWeight });
      study = 1;
      tailWeight = 1;
    }
    loopStart = length();
    seated(6.8);
  }
  return {
    mode,
    segments,
    duration: length(),
    loopStart,
    loop: ["auto", "rest", "tail"].includes(mode),
    travel: layout.travel,
    unit: layout.unit,
  };
}

export function catSequenceTime(sequence, elapsed) {
  const time = Math.max(0, elapsed);
  if (!sequence.loop || time < sequence.duration) return Math.min(time, sequence.duration);
  return (
    sequence.loopStart + ((time - sequence.loopStart) % (sequence.duration - sequence.loopStart))
  );
}

export function nextCatSwitchTime(sequence, elapsed) {
  const time = Math.max(0, elapsed);
  const local = catSequenceTime(sequence, time);
  if (sampleCatSequence(sequence, time).safe) return time;
  let start = 0;
  for (const segment of sequence.segments) {
    if (segment.safe && start >= local - 1e-9) return time + start - local;
    start += segment.duration;
  }
  return time + sequence.duration - local;
}

export function sampleCatSequence(sequence, elapsed) {
  const localTime = catSequenceTime(sequence, elapsed);
  let local = localTime;
  let segment = sequence.segments.at(-1);
  for (const candidate of sequence.segments) {
    segment = candidate;
    if (local < candidate.duration - 1e-9) break;
    local -= candidate.duration;
  }
  if (!sequence.loop && elapsed >= sequence.duration) local = segment.duration;
  const p = clamp(local / segment.duration, 0, 1);
  const travel =
    segment.curve === "accelerate" ? p * p : segment.curve === "decelerate" ? p * (2 - p) : p;
  const result = {
    kind: segment.kind,
    sheet: "jump",
    frame: 0,
    x: mix(segment.from, segment.to, travel),
    direction: segment.direction,
    lift: 0,
    study: segment.study,
    tailWeight: 0,
    label: "站稳观察",
    posture: segment.posture ?? "moving",
    safe: Boolean(segment.safe),
    done: !sequence.loop && elapsed >= sequence.duration,
  };
  const clip = CAT_CLIPS[segment.kind];
  if (clip) {
    const index = Math.min(clip.length - 1, Math.floor(p * clip.length));
    [result.sheet, result.frame] = clip[index];
    result.label = {
      rise: "慢慢起身",
      lower: "收腿坐下",
      start: "迈步起跑",
      brake: "收步站稳",
      crouch: "屈腿蓄力",
      recover: "落地后站起",
      turn: "小步转身",
    }[segment.kind];
    if (segment.kind === "turn" && index === clip.length - 1)
      result.direction = segment.endDirection;
  } else if (["sit", "tail-settle", "focus"].includes(segment.kind)) {
    result.sheet = "idle";
    result.label =
      segment.kind === "tail-settle"
        ? "收好尾巴"
        : segment.kind === "focus"
          ? "调整观察距离"
          : "坐下休息";
    result.tailWeight =
      segment.kind === "tail-settle"
        ? segment.tailFrom * (1 - ease(p))
        : segment.kind === "sit"
          ? mix(segment.tailFrom, 1, ease(Math.min(1, local / 0.35)))
          : mix(segment.tailFrom, 1, ease(p));
    if (
      segment.kind === "sit" &&
      sequence.loop &&
      elapsed >= sequence.duration &&
      Math.abs(localTime - local - sequence.loopStart) < 1e-6
    )
      result.tailWeight = 1;
    if (segment.kind === "focus") result.study = mix(segment.studyFrom, segment.studyTo, ease(p));
  } else if (segment.kind === "run") {
    result.sheet = "run";
    result.frame = Math.floor(p * segment.cycles * 8) % 8;
    result.label = "小跑";
  } else if (segment.kind === "push") {
    result.frame = 2;
    result.label = "蹬地起跳";
  } else if (segment.kind === "flight") {
    result.frame = p < 0.28 ? 3 : p < 0.57 ? 4 : 5;
    result.lift = 4 * p * (1 - p) * 0.74;
    result.label = p < 0.5 ? "跃起" : "准备落地";
  } else if (segment.kind === "land") {
    result.frame = 6;
    result.label = "落地缓冲";
  }
  return result;
}
