/**
 * @purpose 让原 demo 中的独立小猫画布播放尾尖动画
 * @role 猫专属控件、加载与动画生命周期
 * @deps cat-renderer.js、两张分层 PNG、ResizeObserver / IntersectionObserver
 * @gotcha 不读写花草控件；暂停保持当前帧，零幅度回原形；后台和屏外取消动画帧
 */
import { createCatRenderer } from "./cat-renderer.js";
import { CAT_SIZE } from "./tail-motion.mjs";

const $ = (id) => document.getElementById(id);
const board = $("cat-board");
const stage = $("cat-stage");
const canvas = $("cat-canvas");
const controls = $("cat-controls");
const pause = $("cat-pause");
const amplitude = $("cat-amplitude");
const grid = $("cat-grid");
const tailOnly = $("cat-tail-only");
const status = $("cat-status");
const fallback = $("cat-fallback");
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

function draw() {
  renderer?.draw(time, Number(amplitude.value) / 100, grid.checked, tailOnly.checked);
}
function tick(timestamp) {
  if (previous !== null) time += Math.min((timestamp - previous) / 1000, 0.05);
  previous = timestamp;
  draw();
  frame = requestAnimationFrame(tick);
}
function playback() {
  cancelAnimationFrame(frame);
  previous = null;
  if (!renderer || failed || signal.aborted) return;
  pause.textContent = paused ? "播放尾巴" : "暂停尾巴";
  pause.setAttribute("aria-pressed", String(paused));
  status.textContent = paused ? "已暂停" : Number(amplitude.value) === 0 ? "静止原形" : "尾尖轻摆";
  draw();
  const running =
    !paused && Number(amplitude.value) > 0 && visible && !document.hidden && pageActive;
  board.dataset.motion = running ? "playing" : "paused";
  if (running) frame = requestAnimationFrame(tick);
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
  if (!renderer || failed) return;
  renderer.resize(stage.clientWidth, stage.clientHeight);
  draw();
});
const visibilityObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  playback();
});

try {
  const images = await Promise.all(
    ["body-no-tail-v1", "tail-v1"].map(async (name) => {
      const image = new Image();
      image.src = `/cat/${name}.png`;
      await image.decode();
      if (image.naturalWidth !== CAT_SIZE || image.naturalHeight !== CAT_SIZE)
        throw new Error("小猫图层尺寸不一致，暂时显示静态预览。");
      return image;
    }),
  );
  renderer = createCatRenderer(canvas, $("cat-mesh"), ...images);
  renderer.resize(stage.clientWidth, stage.clientHeight);
  draw();
  canvas.hidden = false;
  fallback.hidden = true;
  controls.disabled = false;
  board.dataset.state = "ready";
  pause.addEventListener(
    "click",
    () => {
      paused = !paused;
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
} catch (error) {
  fail(error);
}
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
