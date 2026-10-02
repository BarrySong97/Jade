/**
 * @purpose 将透明港口、帆船与海鸥原画合成为可暂停的海边小景
 * @role 独立 Canvas 2D Demo 控制与渲染
 * @deps scene.mjs、assets/*.webp
 * @gotcha 原图不重绘；船以水线定位，海鸥以肩部注册点对齐；屏外/后台停表，减少动态默认暂停；卸载清理事件与观察器
 */
import {
  ASSET_NAMES,
  GULL_ATLAS,
  VOYAGE_SECONDS,
  gullRect,
  phaseAt,
  sampleBoat,
  sampleGull,
  sceneLayout,
} from "./scene.mjs";

const canvas = document.querySelector("#harbor");
const scene = document.querySelector("#scene");
const fallback = document.querySelector("#fallback");
const status = document.querySelector("#status");
const toggle = document.querySelector("#toggle");
const restart = document.querySelector("#restart");
const speedButton = document.querySelector("#speed");
const progress = document.querySelector("#progress");
const output = document.querySelector("#time");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const events = new AbortController();
let time = 2.5;
let running = !reduced.matches;
let visible = true;
let speed = 1;
let ready = false;
let raf = 0;
let previous = null;
let lastStage = "";
let layout;
let images;
const context = canvas.getContext("2d");

function loadImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Cannot load ${name}`));
    img.src = `/assets/${name}.webp`;
  });
}

function drawBoat(pose) {
  if (pose.opacity <= 0) return;
  context.save();
  context.translate(pose.x, pose.y);
  context.globalAlpha = pose.opacity;
  const w = pose.width;
  // 稀薄尾流留在水面，轻摇只作用于船身。
  context.strokeStyle = "rgba(243,247,238,0.5)";
  context.lineWidth = Math.max(0.4, w * 0.013);
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(-w * 0.23, -w * 0.025);
    context.quadraticCurveTo(
      -w * 0.47,
      w * (0.045 + side * 0.025),
      -w * 0.68,
      w * (0.07 + side * 0.05),
    );
    context.stroke();
  }
  context.rotate(pose.angle);
  context.drawImage(images[1], -w * 0.51, -w * 0.913, w, w);
  context.restore();
}

function drawGull(pose) {
  const [x, y, w, h] = gullRect(pose.frame);
  const [ax, ay] = GULL_ATLAS.anchors[pose.frame];
  const ratio = images[2].width / GULL_ATLAS.width;
  const scale = pose.span / 340;
  context.save();
  context.translate(pose.x, pose.y);
  context.rotate(pose.angle);
  context.scale(pose.direction, 1);
  context.globalAlpha = pose.opacity;
  context.drawImage(
    images[2],
    x * ratio,
    y * ratio,
    w * ratio,
    h * ratio,
    -ax * scale,
    -ay * scale,
    w * scale,
    h * scale,
  );
  context.restore();
}

function draw() {
  if (!ready) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);
  context.drawImage(images[0], layout.left, layout.top, layout.plateWidth, layout.plateHeight);
  const boat = sampleBoat(time, layout);
  drawBoat(boat);
  for (let i = 2; i >= 0; i--) drawGull(sampleGull(time, i, layout));
  const label = running ? boat.stage : "已暂停";
  if (label !== lastStage) {
    status.textContent = label;
    lastStage = label;
  }
  progress.value = String(phaseAt(time));
  output.textContent = `${String(Math.floor(phaseAt(time))).padStart(2, "0")} / 64s`;
  // 观察值供浏览器验证暂停/生命周期，不驱动动画。
  canvas.dataset.time = time.toFixed(3);
  canvas.dataset.stage = boat.stage;
}

function tick(now) {
  raf = 0;
  if (!ready || !running || !visible || document.hidden) {
    previous = null;
    return;
  }
  if (previous !== null) time += Math.min((now - previous) / 1000, 0.08) * speed;
  previous = now;
  draw();
  raf = requestAnimationFrame(tick);
}

function sync() {
  cancelAnimationFrame(raf);
  raf = 0;
  previous = null;
  toggle.textContent = running ? "暂停" : "播放";
  toggle.setAttribute("aria-pressed", String(!running));
  draw();
  if (ready && running && visible && !document.hidden) raf = requestAnimationFrame(tick);
}

function resize() {
  layout = sceneLayout(scene.clientWidth, scene.clientHeight);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(layout.width * dpr);
  canvas.height = Math.round(layout.height * dpr);
  draw();
}
const resizeObserver = new ResizeObserver(resize);
const intersectionObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  sync();
});

toggle.addEventListener(
  "click",
  () => {
    running = !running;
    sync();
  },
  { signal: events.signal },
);
restart.addEventListener(
  "click",
  () => {
    time = 2.5;
    sync();
  },
  { signal: events.signal },
);
speedButton.addEventListener(
  "click",
  () => {
    speed = speed === 1 ? 0.5 : 1;
    speedButton.setAttribute("aria-pressed", String(speed === 0.5));
    speedButton.textContent = speed === 0.5 ? "恢复 1×" : "慢放 0.5×";
  },
  { signal: events.signal },
);
progress.addEventListener(
  "input",
  () => {
    time = Math.min(Number(progress.value), VOYAGE_SECONDS - 0.001);
    running = false;
    sync();
  },
  { signal: events.signal },
);
document.addEventListener("visibilitychange", sync, { signal: events.signal });
reduced.addEventListener(
  "change",
  () => {
    if (reduced.matches) {
      running = false;
      sync();
    }
  },
  { signal: events.signal },
);
window.addEventListener(
  "pagehide",
  () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    events.abort();
  },
  { once: true },
);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});

try {
  if (!context) throw new Error("Canvas unavailable");
  images = await Promise.all(ASSET_NAMES.map(loadImage));
  ready = true;
  resize();
  canvas.classList.remove("hidden");
  fallback.hidden = true;
  for (const element of [toggle, restart, speedButton, progress]) element.disabled = false;
  resizeObserver.observe(scene);
  intersectionObserver.observe(scene);
  sync();
} catch (error) {
  console.error(error);
  status.textContent = "当前显示静态海港";
}
