/**
 * @purpose 组合五种花草素材，提供风动、暂停和网格预览
 * @role 素材预览的场景排布和生命周期
 * @deps renderer.js、浏览器 ResizeObserver / IntersectionObserver
 * @gotcha 使用确定性排布，缩放后不随机闪变；屏外与后台停止 RAF，减少动态效果时默认暂停
 */
import { createRenderer, loadPlant } from "./renderer.js";

const $ = (id) => document.getElementById(id);
const canvas = $("meadow");
const controls = $("controls");
const stage = $("stage");
const pauseButton = $("pause");
const grid = $("grid");
const windInput = $("wind");
const status = $("status");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let paused = motionPreference.matches;
let visible = true;
let wind = Number(windInput.value) / 100;
let time = 1.1;
let previousTime = null;
let frameId = 0;
let failed = false;

function fail(error) {
  failed = true;
  cancelAnimationFrame(frameId);
  controls.disabled = true;
  status.textContent = "预览不可用";
  $("error").hidden = false;
  $("error").textContent = error.message;
}

try {
  const assets = await Promise.all(
    ["grass-low", "grass-tall", "flower-daisy", "flower-violet", "flower-yellow"].map(loadPlant),
  );
  const byId = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
  const renderer = createRenderer(canvas, $("mesh"), assets);
  let plants = [];

  function draw() {
    if (!failed) renderer.draw(plants, time, wind, grid.checked);
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const scale = width < 640 ? 0.8 : 1;
    const baseline = height + 8;
    plants = [];
    function add(id, x, plantHeight, variant, layer, inspect = false) {
      plants.push({
        asset: byId[id],
        x,
        base: baseline + layer,
        height: plantHeight * scale,
        flip: variant % 2 === 0,
        phase: Math.sin(variant * 1.7) * 0.65 + x * 0.0018,
        stiffness: id.startsWith("flower") ? 0.65 : 1,
        inspect,
      });
    }
    // 高草在后；用不同高度和间距避免等高的重复栅栏感。
    const spacing = 106 * scale;
    for (let i = -1; i * spacing < width + spacing; i++) {
      const x = i * spacing + Math.sin(i * 2.3) * 23 * scale;
      const mound = 0.5 + 0.5 * Math.sin(i * 1.4 + 0.8);
      add("grass-tall", x, 158 + mound * 102, i, 0, i % 5 === 2);
    }
    // 后层矮草填根部，让细茎看起来长在一片草里。
    for (let i = -1; i * 88 * scale < width + 88; i++) {
      add("grass-low", i * 88 * scale, 91 + (Math.sin(i * 2.8) + 1) * 17, i, 9);
    }
    const flowers = [
      "flower-daisy",
      "flower-yellow",
      "flower-violet",
      "flower-daisy",
      "flower-violet",
      "flower-yellow",
    ];
    const flowerSpacing = 123 * scale;
    for (let i = 0; i * flowerSpacing < width + flowerSpacing; i++) {
      const id = flowers[i % flowers.length];
      const x = 40 * scale + i * flowerSpacing + Math.sin(i * 1.8) * 21 * scale;
      const plantHeight =
        (id === "flower-daisy" ? 212 : id === "flower-violet" ? 192 : 157) + Math.sin(i * 2.7) * 27;
      add(id, x, plantHeight, i + 3, 5, i % 3 === 0);
    }
    // 最前方用小草遮住收束的根部；画布底部自然裁去根尖。
    for (let i = -1; i * 73 * scale < width + 73; i++) {
      add("grass-low", i * 73 * scale + 21, 53 + (Math.sin(i * 1.9) + 1) * 13, i + 1, 16);
    }
    renderer.resize(width, height);
    draw();
  }

  function tick(timestamp) {
    if (previousTime !== null) time += Math.min((timestamp - previousTime) / 1000, 0.05);
    previousTime = timestamp;
    draw();
    frameId = requestAnimationFrame(tick);
  }

  function playback() {
    cancelAnimationFrame(frameId);
    previousTime = null;
    if (failed) return;
    pauseButton.textContent = paused ? "开启微风" : "暂停微风";
    status.textContent = paused ? "静止观赏" : wind === 0 ? "无风" : "微风中";
    draw();
    if (!paused && visible && !document.hidden && wind > 0) frameId = requestAnimationFrame(tick);
  }
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    playback();
  });
  grid.addEventListener("change", draw);
  windInput.addEventListener("input", () => {
    wind = Number(windInput.value) / 100;
    $("wind-value").value = windInput.value;
    playback();
  });
  document.addEventListener("visibilitychange", playback);
  motionPreference.addEventListener("change", (event) => {
    paused = event.matches;
    playback();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail(new Error("图形上下文已丢失，请刷新页面。下方仍可查看原始素材。"));
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    playback();
  });
  intersectionObserver.observe(stage);
  window.addEventListener("pagehide", (event) => {
    cancelAnimationFrame(frameId);
    if (!event.persisted) {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      renderer.destroy();
    }
  });
  window.addEventListener("pageshow", playback);
  controls.disabled = false;
  resize();
  playback();
  document.documentElement.dataset.ready = "true";
} catch (error) {
  fail(error);
}
