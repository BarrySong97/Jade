/**
 * @purpose 在原花草 demo 加载并控制完整追蝶场景
 * @role 独立画板的 DOM、资源与动画生命周期入口
 * @deps 三个 chase 纯模块、chase-renderer.js、共享 loadPlant 和 MEADOW_ASSET_IDS
 * @gotcha 全场共用时钟；屏外/后台停表，减少动态默认暂停；尺寸变化保留剧情位置
 */
import { loadPlant } from "../renderer.js";
import { MEADOW_ASSET_IDS } from "../../../src/lib/meadow-layout.mjs";
import { CHASE_ATLASES } from "./chase-assets.mjs";
import { chaseLayout } from "./chase-layout.mjs";
import { createChaseStory, sampleChase, locateChase, remapChaseTime } from "./chase-motion.mjs";
import { createChaseRenderer, drawChaseFallback } from "./chase-renderer.js";

const board = document.querySelector("#chase-scene");
const stage = document.querySelector("#chase-stage");
const canvas = document.querySelector("#chase-canvas");
const fallback = document.querySelector("#chase-fallback");
const status = document.querySelector("#chase-status");
const controls = document.querySelector("#chase-controls");
const pause = document.querySelector("#chase-pause");
const speed = document.querySelector("#chase-speed");
const seek = document.querySelector("#chase-seek");
const progress = document.querySelector("#chase-progress");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const images = new Map();
let byId;
let layout;
let story;
let renderer;
let elapsed = 0;
let paused = reduced.matches;
let visible = false;
let lost = false;
let disposed = false;
let raf = 0;
let previous = 0;

function draw() {
  if (!renderer || lost || !story || disposed) return;
  const motion = sampleChase(story, elapsed);
  renderer.draw(layout, motion, elapsed);
  const label = `第 ${motion.round.index + 1} 轮 · ${motion.label}${motion.segment.kind === "focus" ? `（${motion.focusSeconds} 秒）` : ""}`;
  if (status.textContent !== label) status.textContent = label;
  seek.value = String((motion.roundTime / motion.round.duration) * 1000);
  progress.textContent = `${motion.roundTime.toFixed(1)} / ${motion.round.duration.toFixed(1)} 秒`;
}
function tick(now) {
  raf = 0;
  if (previous) elapsed += Math.min(0.06, (now - previous) / 1000) * Number(speed.value);
  previous = now;
  draw();
  raf = requestAnimationFrame(tick);
}
function sync() {
  cancelAnimationFrame(raf);
  raf = 0;
  previous = 0;
  pause.textContent = paused ? "播放" : "暂停";
  pause.setAttribute("aria-pressed", String(paused));
  if (!paused && visible && !document.hidden && renderer && !lost && !disposed)
    raf = requestAnimationFrame(tick);
}
function resize() {
  if (!byId || disposed) return;
  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  for (const item of [canvas, fallback]) {
    item.width = Math.round(rect.width * ratio);
    item.height = Math.round(rect.height * ratio);
  }
  layout = chaseLayout(rect.width, rect.height, byId);
  const next = createChaseStory(layout);
  if (story) elapsed = remapChaseTime(story, next, elapsed);
  story = next;
  const staticLayout = { ...layout, wind: 0 };
  const staticStory = { ...story, layout: staticLayout };
  drawChaseFallback(
    fallback,
    staticLayout,
    sampleChase(staticStory, story.rounds[0].focus.start + 0.5),
    images,
  );
  draw();
}
pause.addEventListener("click", () => {
  paused = !paused;
  sync();
});
speed.addEventListener("change", sync);
seek.addEventListener("input", () => {
  if (!story) return;
  const at = locateChase(story, elapsed);
  elapsed = at.absoluteStart + at.round.duration * Math.min(0.999999, Number(seek.value) / 1000);
  paused = true;
  sync();
  draw();
});
document.querySelector("#chase-restart").addEventListener("click", () => {
  elapsed = 0;
  paused = false;
  sync();
  draw();
});
const onVisibility = () => sync();
document.addEventListener("visibilitychange", onVisibility);
const onReduced = () => {
  paused = reduced.matches;
  sync();
};
reduced.addEventListener("change", onReduced);
const intersection = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  sync();
});
intersection.observe(board);
const observer = new ResizeObserver(resize);
observer.observe(stage);
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  lost = true;
  canvas.hidden = true;
  fallback.hidden = false;
  controls.disabled = true;
  status.textContent = "绘图暂时中断，显示静态场景";
  sync();
});
canvas.addEventListener("webglcontextrestored", () => {
  if (disposed) return;
  try {
    renderer?.dispose();
    renderer = createChaseRenderer(canvas, images);
    lost = false;
    canvas.hidden = false;
    fallback.hidden = true;
    controls.disabled = false;
    draw();
    sync();
  } catch {
    status.textContent = "暂时无法恢复动画，显示静态场景";
  }
});

async function init() {
  try {
    const plants = await Promise.all(MEADOW_ASSET_IDS.map((id) => loadPlant(id)));
    if (disposed) return;
    byId = Object.fromEntries(plants.map((asset) => [asset.id, asset]));
    for (const asset of plants) images.set(asset.id, asset.image);
    resize();
    await Promise.all(
      Object.entries(CHASE_ATLASES).map(async ([id, atlas]) => {
        const image = new Image();
        image.src = atlas.file;
        await image.decode();
        if (!disposed) images.set(id, image);
      }),
    );
    if (disposed) return;
    resize();
    renderer = createChaseRenderer(canvas, images);
    canvas.hidden = false;
    fallback.hidden = true;
    controls.disabled = false;
    draw();
    sync();
  } catch {
    if (disposed) return;
    status.textContent = "动画暂不可用；刷新页面可重试";
    const error = document.querySelector("#chase-error");
    error.hidden = false;
    error.textContent = byId
      ? "部分素材或 WebGL 未加载成功，已保留静态花草。下方可查看原始动作素材。"
      : "花草素材未加载成功，请刷新重试。下方可查看原始动作素材。";
  }
}
window.addEventListener("pagehide", (event) => {
  cancelAnimationFrame(raf);
  previous = 0;
  if (event.persisted) return;
  disposed = true;
  observer.disconnect();
  intersection.disconnect();
  document.removeEventListener("visibilitychange", onVisibility);
  reduced.removeEventListener("change", onReduced);
  renderer?.dispose();
  images.clear();
});
window.addEventListener("pageshow", () => {
  if (!disposed) {
    draw();
    sync();
  }
});
init();
