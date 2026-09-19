/**
 * @purpose 在原花草 demo 的独立 Canvas 衔接猫的跑跳与休息
 * @role 排队切换动作、骨架辅助线、拖动进度、慢放、暂停和动画生命周期
 * @deps cat-renderer.js、cat-motion.mjs、cat-atlas.mjs、透明 PNG
 * @gotcha 新动作等坐稳/站稳再切换并保留落点；花草独立；屏外/后台停表，减少动态效果默认暂停
 */
import { createCatRenderer } from "./cat-renderer.js";
import { CAT_SIZE } from "./tail-motion.mjs";
import { CAT_ATLASES } from "./cat-atlas.mjs";
import {
  catLayout,
  createCatSequence,
  sampleCatSequence,
  catSequenceTime,
  nextCatSwitchTime,
} from "./cat-motion.mjs";

const $ = (id) => document.getElementById(id);
const board = $("cat-board");
const stage = $("cat-stage");
const canvas = $("cat-canvas");
const controls = $("cat-controls");
const pause = $("cat-pause");
const amplitude = $("cat-amplitude");
const speed = $("cat-speed");
const skeleton = $("cat-skeleton");
const bonesOnly = $("cat-bones-only");
const seek = $("cat-seek");
const poseLabel = $("cat-pose-label");
const grid = $("cat-grid");
const tailOnly = $("cat-tail-only");
const status = $("cat-status");
const fallback = $("cat-fallback");
const actionButtons = [...board.querySelectorAll("[data-cat-action]")];
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const controller = new AbortController();
const { signal } = controller;
let paused = preference.matches;
let visible = false;
let pageActive = true;
let failed = false;
let renderer;
let frame = 0;
let previous = null;
let time = 0;
let tailTime = 0;
let pending = null;
let mode = "auto";
const actionNames = {
  auto: "自动演示",
  run: "跑一段",
  jump: "跳一下",
  rest: "坐下休息",
  tail: "尾巴实验",
};
let sequence = createCatSequence(mode, catLayout(stage.clientWidth, stage.clientHeight));

function draw() {
  const motion = sampleCatSequence(sequence, time);
  const tailStudy = motion.study;
  renderer?.draw(
    tailTime,
    (Number(amplitude.value) / 100) * motion.tailWeight,
    mode === "tail" && grid.checked,
    mode === "tail" && tailOnly.checked,
    motion,
    tailStudy,
    { showSkeleton: skeleton.checked, bonesOnly: bonesOnly.checked },
  );
  const position = catSequenceTime(sequence, time);
  seek.value = String(Math.round((position / sequence.duration) * 1000));
  const description =
    motion.sheet === "idle"
      ? "坐姿 · 尾巴网格"
      : `${CAT_ATLASES[motion.sheet].label} · ${motion.frame + 1} / 8`;
  if (poseLabel.textContent !== description) poseLabel.textContent = description;
  seek.setAttribute(
    "aria-valuetext",
    `${description}，动作进度 ${Math.round((position / sequence.duration) * 100)}%`,
  );
  const label = paused
    ? "已暂停"
    : pending
      ? `${motion.label} · 接着${actionNames[pending.mode]}`
      : motion.done
        ? "休息中 · 可再点一次"
        : tailStudy
          ? "尾巴网格实验"
          : motion.label;
  if (status.textContent !== label) status.textContent = label;
  board.dataset.action = mode;
  board.dataset.phase = motion.kind;
  board.dataset.done = String(motion.done);
  board.dataset.pending = pending?.mode ?? "";
  return motion;
}
function canPlay() {
  return !paused && visible && !document.hidden && pageActive && !failed && !signal.aborted;
}
function tick(timestamp) {
  if (previous !== null) {
    const delta = Math.min((timestamp - previous) / 1000, 0.05) * Number(speed.value);
    time += delta;
    tailTime += delta;
  }
  previous = timestamp;
  applyPending();
  const motion = draw();
  if (
    motion.done ||
    (mode === "tail" && motion.safe && Number(amplitude.value) === 0 && !pending)
  ) {
    board.dataset.motion = motion.done ? "finished" : "paused";
    previous = null;
    frame = 0;
  } else if (canPlay()) frame = requestAnimationFrame(tick);
}
function playback() {
  cancelAnimationFrame(frame);
  previous = null;
  if (!renderer || failed || signal.aborted) return;
  pause.textContent = paused ? "继续播放" : "暂停";
  pause.setAttribute("aria-pressed", String(paused));
  const motion = draw();
  const running =
    canPlay() &&
    !motion.done &&
    !(mode === "tail" && motion.safe && Number(amplitude.value) === 0 && !pending);
  board.dataset.motion = running ? "playing" : motion.done ? "finished" : "paused";
  if (running) frame = requestAnimationFrame(tick);
}
function updateActionButtons() {
  for (const button of actionButtons)
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.catAction === (pending?.mode ?? mode)),
    );
  $("cat-tail-controls").hidden = mode !== "tail";
}
function applyPending() {
  if (!pending || time + 1e-9 < pending.at) return;
  const start = sampleCatSequence(sequence, pending.at);
  mode = pending.mode;
  sequence = createCatSequence(mode, catLayout(stage.clientWidth, stage.clientHeight), start);
  time = 0;
  pending = null;
  updateActionButtons();
}
function selectAction(nextMode) {
  // Latest request wins; the current clip reaches a planted-paw checkpoint first.
  pending = { mode: nextMode, at: nextCatSwitchTime(sequence, time) };
  paused = false;
  applyPending();
  updateActionButtons();
  playback();
}
function fail(error) {
  failed = true;
  cancelAnimationFrame(frame);
  controls.disabled = true;
  canvas.hidden = true;
  $("cat-mesh").hidden = true;
  fallback.hidden = false;
  status.textContent = "静态预览";
  $("cat-error").textContent = error.message;
  $("cat-error").hidden = false;
  board.dataset.state = "static";
  board.dataset.motion = "paused";
}
const resizeObserver = new ResizeObserver(() => {
  if (!renderer || failed || stage.clientWidth === 0) return;
  renderer.resize(stage.clientWidth, stage.clientHeight);
  // Preserve phase on resize; normalized positions stay inside the new viewport.
  draw();
});
const visibilityObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  playback();
});
window.addEventListener("pagehide", (event) => {
  pageActive = false;
  cancelAnimationFrame(frame);
  if (!event.persisted) {
    controller.abort();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    renderer?.destroy();
  }
});
window.addEventListener("pageshow", () => {
  pageActive = true;
  playback();
});

try {
  const entries = [
    ["body", "body-no-tail-v1.png", CAT_SIZE, CAT_SIZE],
    ["tail", "tail-v1.png", CAT_SIZE, CAT_SIZE],
    ...Object.entries(CAT_ATLASES).map(([name, atlas]) => [
      name,
      atlas.file,
      atlas.width,
      atlas.height,
    ]),
  ];
  const images = Object.fromEntries(
    await Promise.all(
      entries.map(async ([name, file, width, height]) => {
        const image = new Image();
        image.src = `/cat/${file}`;
        await image.decode();
        if (image.naturalWidth !== width || image.naturalHeight !== height)
          throw new Error("小猫动作素材尺寸与图集不一致，暂时显示静态预览。");
        return [name, image];
      }),
    ),
  );
  if (!signal.aborted) {
    renderer = createCatRenderer(
      canvas,
      $("cat-mesh"),
      images.body,
      images.tail,
      Object.fromEntries(Object.keys(CAT_ATLASES).map((name) => [name, images[name]])),
    );
    renderer.resize(stage.clientWidth, stage.clientHeight);
    draw();
    canvas.hidden = false;
    fallback.hidden = true;
    controls.disabled = false;
    board.dataset.state = "ready";
    for (const button of actionButtons)
      button.addEventListener("click", () => selectAction(button.dataset.catAction), { signal });
    pause.addEventListener(
      "click",
      () => {
        if (sampleCatSequence(sequence, time).done) {
          selectAction(mode);
          return;
        }
        paused = !paused;
        playback();
      },
      { signal },
    );
    speed.addEventListener("change", playback, { signal });
    skeleton.addEventListener(
      "change",
      () => {
        bonesOnly.disabled = !skeleton.checked;
        $("cat-skeleton-legend").hidden = !skeleton.checked;
        draw();
      },
      { signal },
    );
    bonesOnly.addEventListener("change", draw, { signal });
    seek.addEventListener(
      "input",
      () => {
        pending = null;
        updateActionButtons();
        paused = true;
        time = (Number(seek.value) / 1000) * sequence.duration;
        if (sequence.loop) time = Math.min(time, sequence.duration - 0.00001);
        tailTime = time;
        playback();
      },
      { signal },
    );
    amplitude.addEventListener(
      "input",
      () => {
        $("cat-amplitude-value").value = `${amplitude.value}%`;
        playback();
      },
      { signal },
    );
    grid.addEventListener("change", draw, { signal });
    tailOnly.addEventListener("change", draw, { signal });
    preference.addEventListener(
      "change",
      (event) => {
        paused = event.matches;
        playback();
      },
      { signal },
    );
    document.addEventListener("visibilitychange", playback, { signal });
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        fail(new Error("图形上下文已中断，刷新页面可重新播放。"));
      },
      { signal },
    );
    resizeObserver.observe(stage);
    visibilityObserver.observe(stage);
    playback();
  }
} catch (error) {
  if (!signal.aborted) fail(error);
}
