/**
 * @purpose 在原花草 demo 的独立 Canvas 播放猫的跑跳与休息
 * @role 动作按钮、慢放、暂停和动画生命周期
 * @deps cat-renderer.js、cat-motion.mjs、cat-atlas.mjs、透明 PNG
 * @gotcha 花草状态独立；单次动作结束保持落点；屏外/后台停表，减少动态效果默认暂停
 */
import { createCatRenderer } from "./cat-renderer.js";
import { CAT_SIZE } from "./tail-motion.mjs";
import { CAT_ATLASES } from "./cat-atlas.mjs";
import { catLayout, createCatSequence, sampleCatSequence } from "./cat-motion.mjs";

const $ = (id) => document.getElementById(id);
const board = $("cat-board");
const stage = $("cat-stage");
const canvas = $("cat-canvas");
const controls = $("cat-controls");
const pause = $("cat-pause");
const amplitude = $("cat-amplitude");
const speed = $("cat-speed");
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
let mode = "auto";
let sequence = createCatSequence(mode, catLayout(stage.clientWidth, stage.clientHeight));

function draw() {
  const motion = sampleCatSequence(sequence, time);
  const tailStudy = mode === "tail";
  renderer?.draw(
    time,
    Number(amplitude.value) / 100,
    tailStudy && grid.checked,
    tailStudy && tailOnly.checked,
    motion,
    tailStudy,
  );
  const label = paused
    ? "已暂停"
    : motion.done
      ? "休息中 · 可再点一次"
      : tailStudy
        ? "尾巴网格实验"
        : motion.label;
  if (status.textContent !== label) status.textContent = label;
  board.dataset.action = mode;
  board.dataset.phase = motion.kind;
  board.dataset.done = String(motion.done);
  return motion;
}
function canPlay() {
  return !paused && visible && !document.hidden && pageActive && !failed && !signal.aborted;
}
function tick(timestamp) {
  if (previous !== null)
    time += Math.min((timestamp - previous) / 1000, 0.05) * Number(speed.value);
  previous = timestamp;
  const motion = draw();
  if (motion.done) {
    board.dataset.motion = "finished";
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
  const running = canPlay() && !motion.done && !(mode === "tail" && Number(amplitude.value) === 0);
  board.dataset.motion = running ? "playing" : motion.done ? "finished" : "paused";
  if (running) frame = requestAnimationFrame(tick);
}
function selectAction(nextMode) {
  const start = sampleCatSequence(sequence, time);
  mode = nextMode;
  sequence = createCatSequence(mode, catLayout(stage.clientWidth, stage.clientHeight), start);
  time = 0;
  // Clicking an action is explicit opt-in, including under reduced-motion preferences.
  paused = false;
  for (const button of actionButtons)
    button.setAttribute("aria-pressed", String(button.dataset.catAction === mode));
  $("cat-tail-controls").hidden = mode !== "tail";
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
    renderer = createCatRenderer(canvas, $("cat-mesh"), images.body, images.tail, {
      run: images.run,
      jump: images.jump,
    });
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
        paused = !paused;
        if (!paused && sampleCatSequence(sequence, time).done) time = 0;
        playback();
      },
      { signal },
    );
    speed.addEventListener("change", playback, { signal });
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
