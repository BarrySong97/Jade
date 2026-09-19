/**
 * @purpose 在原花草 demo 的独立 Canvas 展示透明手绘蝴蝶振翅与飞行
 * @role 加载原画、绘制当前姿势、控制慢放与原地观察以及独立生命周期
 * @deps butterfly-motion.mjs、Canvas 2D、ResizeObserver / IntersectionObserver
 * @gotcha 原画只在运行时采样；屏外/后台停表，减少动态默认暂停；不改变猫与花草状态
 */
import {
  BUTTERFLY_ATLAS,
  FLIGHT_SECONDS,
  butterflyLayout,
  butterflyFlightPoint,
  butterflyFocus,
  sampleButterfly,
} from "./butterfly-motion.mjs";

const $ = (id) => document.getElementById(id);
const board = $("butterfly-board");
const stage = $("butterfly-stage");
const canvas = $("butterfly-canvas");
const controls = $("butterfly-controls");
const pause = $("butterfly-pause");
const speed = $("butterfly-speed");
const trace = $("butterfly-trace");
const status = $("butterfly-status");
const frameLabel = $("butterfly-frame");
const buttons = [...board.querySelectorAll("[data-butterfly-mode]")];
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const controller = new AbortController();
const { signal } = controller;
let context;
let layout;
let image;
let time = 0;
let paused = preference.matches;
let mode = "flight";
let transition = { from: 0, to: 0, at: 0 };
let visible = false;
let pageActive = true;
let failed = false;
let frameId = 0;
let previous = null;

function draw() {
  if (!context || !image || !layout || failed) return;
  const focus = butterflyFocus(transition, time);
  const pose = sampleButterfly(time, layout, focus);
  context.clearRect(0, 0, layout.width, layout.height);
  if (trace.checked && focus < 1) {
    context.save();
    context.globalAlpha = (1 - focus) * 0.6;
    context.strokeStyle = "#9ba88b";
    context.lineWidth = 1;
    context.setLineDash([3, 6]);
    context.beginPath();
    for (let i = 0; i <= 160; i++) {
      const point = butterflyFlightPoint((i / 160) * FLIGHT_SECONDS, layout);
      if (i === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.restore();
  }
  const {
    rect: [sx, sy, width, height],
    anchor,
  } = BUTTERFLY_ATLAS.frames[pose.frame];
  const scale = pose.span / BUTTERFLY_ATLAS.span;
  context.save();
  context.translate(pose.x, pose.y);
  context.rotate(pose.angle);
  context.scale(scale, scale);
  context.drawImage(image, sx, sy, width, height, -anchor[0], -anchor[1], width, height);
  context.restore();
  const label = paused
    ? "已暂停"
    : Math.abs(focus - transition.to) > 0.001
      ? "调整观察位置"
      : mode === "study"
        ? "原地振翅"
        : "轻轻飞行";
  if (status.textContent !== label) status.textContent = label;
  const description = `振翅姿势 ${pose.frame + 1} / 8`;
  if (frameLabel.textContent !== description) frameLabel.textContent = description;
  canvas.dataset.pose = String(pose.frame);
  canvas.dataset.time = time.toFixed(4);
  canvas.dataset.focus = focus.toFixed(4);
  board.dataset.mode = mode;
}

function canPlay() {
  return Boolean(
    context &&
    image &&
    layout &&
    !paused &&
    visible &&
    !document.hidden &&
    pageActive &&
    !failed &&
    !signal.aborted,
  );
}
function tick(timestamp) {
  frameId = 0;
  if (!canPlay()) {
    previous = null;
    return;
  }
  if (previous !== null)
    time += Math.min((timestamp - previous) / 1000, 0.05) * Number(speed.value);
  previous = timestamp;
  draw();
  frameId = requestAnimationFrame(tick);
}
function playback() {
  cancelAnimationFrame(frameId);
  frameId = 0;
  previous = null;
  pause.textContent = paused ? "播放" : "暂停";
  pause.setAttribute("aria-pressed", String(paused));
  draw();
  const running = canPlay();
  board.dataset.motion = running ? "playing" : "paused";
  if (running) frameId = requestAnimationFrame(tick);
}
function resize() {
  if (!context || failed || !stage.clientWidth) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(stage.clientWidth * dpr);
  canvas.height = Math.round(stage.clientHeight * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  layout = butterflyLayout(stage.clientWidth, stage.clientHeight);
  draw();
}
const resizeObserver = new ResizeObserver(resize);
const visibilityObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  playback();
});
function fail(error) {
  failed = true;
  cancelAnimationFrame(frameId);
  canvas.hidden = true;
  $("butterfly-fallback").hidden = false;
  controls.disabled = true;
  status.textContent = "静态原画";
  $("butterfly-error").textContent = error.message;
  $("butterfly-error").hidden = false;
  board.dataset.state = "static";
  board.dataset.motion = "paused";
}
window.addEventListener(
  "pagehide",
  (event) => {
    pageActive = false;
    cancelAnimationFrame(frameId);
    if (!event.persisted) {
      controller.abort();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    }
  },
  { signal },
);
window.addEventListener(
  "pageshow",
  () => {
    pageActive = true;
    playback();
  },
  { signal },
);

try {
  const artwork = new Image();
  artwork.src = `/butterfly/${BUTTERFLY_ATLAS.file}`;
  await artwork.decode();
  if (
    artwork.naturalWidth !== BUTTERFLY_ATLAS.width ||
    artwork.naturalHeight !== BUTTERFLY_ATLAS.height
  )
    throw new Error("蝴蝶原画尺寸与动画图集不一致，请刷新后重试。");
  if (!signal.aborted) {
    context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器无法绘制动画，先查看下方的原画。");
    image = artwork;
    resize();
    canvas.hidden = false;
    $("butterfly-fallback").hidden = true;
    controls.disabled = false;
    board.dataset.state = "ready";
    for (const button of buttons)
      button.addEventListener(
        "click",
        () => {
          transition = {
            from: butterflyFocus(transition, time),
            to: button.dataset.butterflyMode === "study" ? 1 : 0,
            at: time,
          };
          mode = button.dataset.butterflyMode;
          for (const candidate of buttons)
            candidate.setAttribute("aria-pressed", String(candidate === button));
          // Explicit playback opt-in also applies under reduced-motion preferences.
          paused = false;
          playback();
        },
        { signal },
      );
    pause.addEventListener(
      "click",
      () => {
        paused = !paused;
        playback();
      },
      { signal },
    );
    speed.addEventListener("change", playback, { signal });
    trace.addEventListener("change", draw, { signal });
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
      "contextlost",
      (event) => {
        event.preventDefault();
        fail(new Error("画布已中断，刷新页面可以重新播放。"));
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
