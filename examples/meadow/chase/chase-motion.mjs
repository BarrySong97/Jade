/**
 * @purpose 编排探头、落花、伏低等待、跑扑与回草丛的共同剧情
 * @role 可暂停、拖动、缩放后恢复的纯时间线；猫接近花头触发蝴蝶逃离
 * @deps cat-motion.mjs 的过渡姿势、chase-layout.mjs 的真实花头投影
 * @gotcha 等待从落花后计时；跑动不能先刹停再跳；循环移动到另一藏身点，不重置位置
 */
import { CAT_CLIPS } from "../cat/cat-motion.mjs";
import { flowerPoint } from "./chase-layout.mjs";

const clamp = (v, low = 0, high = 1) => Math.max(low, Math.min(high, v));
const ease = (p) => p * p * (3 - 2 * p);
const mix = (a, b, p) => a + (b - a) * p;
// Absolute and round-local sums can differ by an ulp at a shared phase boundary.
const before = (a, b) => a < b - 1e-9;
const CLIPS = {
  ...CAT_CLIPS,
  peek: [
    ["stalk", 3],
    ["stalk", 4],
    ["stalk", 5],
    ["stalk", 6],
    ["stalk", 7],
  ],
  dash: [
    ["stalk", 7],
    ["dash", 1],
    ["dash", 2],
    ["run", 0],
  ],
  takeoff: [
    ["run", 0],
    ["dash", 5],
    ["dash", 6],
    ["jump", 3],
  ],
  lower: [
    ["jump", 0],
    ["stalk", 1],
    ["stalk", 2],
    ["stalk", 3],
  ],
};
const LABELS = {
  hidden: "蝴蝶飞过，猫藏在草里",
  peek: "小猫伏低探头",
  approach: "蝴蝶寻找花朵",
  dock: "轻轻落在花上",
  focus: "伏低盯住蝴蝶",
  dash: "从草中起跑",
  run: "追向花边",
  takeoff: "跑动中蹬地扑跳",
  flight: "扑向蝴蝶",
  land: "落地缓冲",
  recover: "收爪站稳",
  watch: "看看飞走的蝴蝶",
  start: "走向另一侧草丛",
  return: "回到草丛",
  brake: "放慢脚步",
  turn: "转身观察",
  lower: "伏低藏好",
  rest: "在草里等一会儿",
};

export function createChaseStory(layout) {
  const rounds = [];
  let storyTime = 0;
  for (let i = 0; i < 6; i++) {
    const direction = i % 2 ? -1 : 1;
    const home = layout.homes[i % 2];
    const destination = layout.homes[1 - (i % 2)];
    const flower = layout.flowers[i % 2];
    const targetX = flowerPoint(flower, 0, 0)[0];
    const segments = [];
    let x = home;
    let time = 0;
    const add = (kind, duration, to = x, curve = "linear", extra = {}) => {
      const segment = { kind, start: time, duration, from: x, to, curve, direction, ...extra };
      segments.push(segment);
      x = to;
      time += duration;
      return segment;
    };
    add("hidden", [1.7, 2.1, 1.9][i % 3]);
    add("peek", 0.85, x + direction * layout.unit * 0.1, "ease");
    const approach = add("approach", 1.1);
    const dock = add("dock", 0.48);
    const focus = add("focus", [1.25, 1.8, 1.5][i % 3]);
    const runEnd = targetX - direction * layout.unit * 1.12;
    const distance = Math.max(layout.unit * 0.15, (runEnd - x) * direction);
    const cycles = Math.max(1, Math.ceil(distance / (layout.unit * 1.25)));
    const runDuration = cycles * 0.56;
    const speed = (direction * distance) / (runDuration + 0.36 / 2);
    const dash = add("dash", 0.36, x + (speed * 0.36) / 2, "accelerate");
    add("run", runDuration, x + speed * runDuration, "linear", { cycles });
    add("takeoff", 0.24, x + speed * 0.24);
    const flight = add("flight", 0.72, x + speed * 0.72);
    add("land", 0.14, x + (speed * 0.14) / 2, "decelerate");
    add("recover", 0.48);
    add("watch", 0.6);
    const backDistance = destination - x;
    const backCycles = Math.max(1, Math.ceil(Math.abs(backDistance) / (layout.unit * 0.85)));
    const backSpeed = backDistance / (backCycles * 0.72 + 0.39);
    add("start", 0.36, x + (backSpeed * 0.36) / 2, "accelerate");
    add("return", backCycles * 0.72, destination - (backSpeed * 0.42) / 2, "linear", {
      cycles: backCycles,
    });
    add("brake", 0.42, destination, "decelerate");
    add("turn", 0.8, x, "linear", { endDirection: -direction });
    add("lower", 0.65, x, "linear", { direction: -direction });
    add("rest", [3.6, 4.4, 3.9][i % 3], x, "linear", { direction: -direction });
    rounds.push({
      index: i,
      start: storyTime,
      duration: time,
      segments,
      flower,
      direction,
      approach,
      dock,
      focus,
      dash,
      flight,
    });
    storyTime += time;
  }
  return { rounds, duration: storyTime, layout };
}

export function locateChase(story, elapsed) {
  const time = Math.max(0, elapsed);
  const cycle = Math.floor(time / story.duration);
  const local = time - cycle * story.duration;
  const round =
    story.rounds.find((candidate) => before(local, candidate.start + candidate.duration)) ??
    story.rounds.at(-1);
  const roundTime = local - round.start;
  const segment =
    round.segments.find((candidate) => before(roundTime, candidate.start + candidate.duration)) ??
    round.segments.at(-1);
  return {
    round,
    roundTime,
    segment,
    progress: clamp((roundTime - segment.start) / segment.duration),
    absoluteStart: cycle * story.duration + round.start,
  };
}

function catInRound(round, time, layout) {
  const segment =
    round.segments.find((candidate) => before(time, candidate.start + candidate.duration)) ??
    round.segments.at(-1);
  const p = clamp((time - segment.start) / segment.duration);
  const curve =
    segment.curve === "ease"
      ? ease(p)
      : segment.curve === "accelerate"
        ? p * p
        : segment.curve === "decelerate"
          ? p * (2 - p)
          : p;
  const pose = {
    sheet: "jump",
    frame: 0,
    x: mix(segment.from, segment.to, curve),
    y: layout.ground,
    direction: segment.direction,
    kind: segment.kind,
  };
  const clip = CLIPS[segment.kind];
  if (clip) {
    const index = Math.min(clip.length - 1, Math.floor(p * clip.length));
    [pose.sheet, pose.frame] = clip[index];
    if (segment.kind === "turn" && index === clip.length - 1) pose.direction = segment.endDirection;
  } else if (["hidden", "rest"].includes(segment.kind)) {
    pose.sheet = "stalk";
    pose.frame = 3;
  } else if (["focus", "approach", "dock"].includes(segment.kind)) {
    pose.sheet = "stalk";
    pose.frame = 7;
  } else if (["run", "return"].includes(segment.kind)) {
    pose.sheet = "run";
    pose.frame = Math.floor(p * segment.cycles * 8) % 8;
  } else if (segment.kind === "flight") {
    pose.frame = p < 0.27 ? 3 : p < 0.7 ? 4 : 5;
    pose.y -= layout.unit * (0.12 * (1 - p) + 4 * p * (1 - p) * 0.85);
  } else if (segment.kind === "land") pose.frame = 6;
  if (segment.kind === "takeoff") pose.y -= layout.unit * 0.12 * ease(p);
  return pose;
}

// The trigger uses the same swaying flower position as rendering, including on later loops.
export function escapeTime(round, layout, absoluteStart) {
  let low = round.dash.start;
  let high = round.flight.start + round.flight.duration;
  for (let i = 0; i < 28; i++) {
    const middle = (low + high) / 2;
    const cat = catInRound(round, middle, layout);
    const target = flowerPoint(round.flower, absoluteStart + middle, layout.wind);
    if ((target[0] - cat.x) * round.direction > layout.unit) low = middle;
    else high = middle;
  }
  return high;
}

function airPoint(time, layout) {
  return [
    layout.width / 2 + layout.half * (0.64 * Math.sin(time * 0.53) + 0.09 * Math.sin(time * 1.21)),
    layout.ground - layout.unit * (2.35 + 0.22 * Math.sin(time * 0.91)),
  ];
}

export function sampleChase(story, elapsed) {
  const time = Math.max(0, elapsed);
  const at = locateChase(story, time);
  const { round, roundTime, absoluteStart } = at;
  const { layout } = story;
  const cat = catInRound(round, roundTime, layout);
  const contact = flowerPoint(round.flower, time, layout.wind);
  const air = airPoint(time, layout);
  const escape = escapeTime(round, layout, absoluteStart);
  let point = air;
  const butterfly = {
    butterfly: true,
    sheet: "wing",
    frame: Math.floor((time / 0.32) * 8) % 8,
    angle: 0.15 * Math.sin(time * 1.3),
    state: "flying",
  };
  if (!before(roundTime, round.approach.start) && before(roundTime, round.focus.start)) {
    const p = clamp(
      (roundTime - round.approach.start) / (round.focus.start - round.approach.start),
    );
    const blend = ease(p);
    point = [
      mix(air[0], contact[0], blend),
      mix(air[1], contact[1], blend) - Math.sin(Math.PI * p) ** 2 * layout.unit * 0.25,
    ];
    butterfly.angle *= 1 - blend;
    butterfly.state = "approaching";
    if (!before(roundTime, round.dock.start)) {
      butterfly.sheet = "perch";
      butterfly.frame = Math.min(
        3,
        Math.floor(((roundTime - round.dock.start) / round.dock.duration) * 4),
      );
      butterfly.state = "landing";
    }
  } else if (!before(roundTime, round.focus.start) && before(roundTime, escape)) {
    point = contact;
    butterfly.sheet = "perch";
    butterfly.frame = 3;
    butterfly.angle = 0;
    butterfly.state = "perched";
  } else if (!before(roundTime, escape) && before(roundTime, escape + 1.15)) {
    const p = clamp((roundTime - escape) / 1.15);
    const bend = Math.sin(Math.PI * p) ** 2;
    point = [
      mix(contact[0], air[0], ease(p)) + round.direction * layout.unit * 0.8 * bend,
      mix(contact[1], air[1], ease(p)) - layout.unit * 0.6 * bend,
    ];
    butterfly.angle = butterfly.angle * ease(p) + 0.24 * round.direction * bend;
    butterfly.state = "evading";
    const lift = (roundTime - escape) / 0.32;
    if (lift < 1) {
      butterfly.sheet = "perch";
      butterfly.frame = [3, 5, 6, 7][clamp(Math.floor(lift * 4), 0, 3)];
    }
  }
  [butterfly.x, butterfly.y] = point;
  return {
    ...at,
    cat,
    butterfly,
    escape,
    label: LABELS[at.segment.kind],
    focusSeconds: round.focus.duration,
  };
}

export function remapChaseTime(previous, next, time) {
  const at = locateChase(previous, time);
  const round = next.rounds[at.round.index];
  const segment = round.segments.find((item) => item.kind === at.segment.kind);
  return (
    Math.floor(Math.max(0, time) / previous.duration) * next.duration +
    round.start +
    segment.start +
    segment.duration * at.progress
  );
}
