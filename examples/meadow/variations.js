/**
 * @purpose 切换自然群落草甸与历次花草组合，展示独立素材
 * @role 页面控制、缩略图和动画生命周期
 * @deps renderer.js、scene-data.mjs、ResizeObserver / IntersectionObserver
 * @gotcha 折叠组展开后重绘缩略图；切换保留暂停状态；自动化点击须用 button[data-scene]，canvas 同样带 data-scene
 */
import { createRenderer, loadPlant } from "./renderer.js";
import { ASSETS, SCENES, arrangeScene } from "./scene-data.mjs";

const $ = (id) => document.getElementById(id);
const canvas = $("meadow");
const controls = $("controls");
const stage = $("stage");
const pauseButton = $("pause");
const grid = $("grid");
const windInput = $("wind");
const status = $("status");
const previousScenes = $("previous-scenes");
const isFeatured = (item) => !item.archived && (item.accents || item.meadow);
const preference = matchMedia("(prefers-reduced-motion: reduce)");
let paused = preference.matches;
let visible = true;
let wind = Number(windInput.value) / 100;
let time = 1.1;
let previousTime = null;
let frameId = 0;
let failed = false;
let scene = SCENES.find((item) => item.id === location.hash.slice(1)) || SCENES[0];
const sceneButtons = new Map();

for (const item of SCENES) {
  const fragment = $("scene-card-template").content.cloneNode(true);
  const button = fragment.querySelector("button");
  button.dataset.scene = item.id;
  button.setAttribute("aria-label", `${item.code} · ${item.name}`);
  button.setAttribute("aria-pressed", String(item.id === scene.id));
  button.querySelector("[data-title]").textContent = `${item.code} · ${item.name}`;
  button.querySelector("[data-mood]").textContent = item.mood;
  sceneButtons.set(item.id, button);
  $(isFeatured(item) ? "scene-options" : "previous-options").append(fragment);
}
previousScenes.open = !isFeatured(scene);
for (const asset of ASSETS) {
  const fragment = $("asset-card-template").content.cloneNode(true);
  fragment.querySelector("a").href = `/assets/${asset.id}.png`;
  const image = fragment.querySelector("img");
  image.src = `/assets/${asset.id}.png`;
  image.alt = `${asset.name}，独立透明手绘素材`;
  fragment.querySelector("[data-name]").textContent = asset.name;
  fragment.querySelector("[data-note]").textContent = asset.note;
  $(asset.refinement ? "refinement-assets" : asset.fresh ? "new-assets" : "original-assets").append(
    fragment,
  );
}

function fail(error) {
  failed = true;
  cancelAnimationFrame(frameId);
  controls.disabled = true;
  for (const button of sceneButtons.values()) button.disabled = true;
  status.textContent = "预览不可用";
  $("error").hidden = false;
  $("error").textContent = error.message;
}

try {
  const assets = await Promise.all(ASSETS.map(({ id }) => loadPlant(id)));
  const byId = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
  const renderer = createRenderer(canvas, $("mesh"), assets);
  let plants = [];
  function draw() {
    if (!failed) renderer.draw(plants, time, wind, grid.checked);
  }
  function drawThumbnail(item, button) {
    const preview = button.querySelector("canvas");
    const width = preview.clientWidth;
    const height = preview.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    preview.width = Math.round(width * dpr);
    preview.height = Math.round(height * dpr);
    const context = preview.getContext("2d");
    // 使用主图的视口尺寸，防止群落数量随宽度变化后缩略图成为另一套排布。
    const sceneWidth = stage.clientWidth;
    const sceneHeight = stage.clientHeight;
    const factor = Math.min(width / sceneWidth, height / sceneHeight);
    context.setTransform(
      dpr * factor,
      0,
      0,
      dpr * factor,
      (dpr * (width - sceneWidth * factor)) / 2,
      dpr * (height - sceneHeight * factor),
    );
    for (const plant of arrangeScene(item, sceneWidth, sceneHeight, byId)) {
      const { asset, x, base, height: plantHeight, flip } = plant;
      const [u, v, du, dv] = asset.crop;
      const image = asset.image;
      const plantWidth = plantHeight * asset.aspect;
      context.save();
      context.translate(x, base);
      context.scale(flip ? -1 : 1, 1);
      context.drawImage(
        image,
        u * image.width,
        v * image.height,
        du * image.width,
        dv * image.height,
        -plantWidth / 2,
        -plantHeight,
        plantWidth,
        plantHeight,
      );
      context.restore();
    }
    preview.dataset.ready = "true";
  }
  function updateScene() {
    plants = arrangeScene(scene, stage.clientWidth, stage.clientHeight, byId);
    $("scene-title").textContent = `${scene.code} · ${scene.name}`;
    $("scene-description").textContent = scene.description;
    const flowerNames = [...new Set(scene.flowers)].map(
      (id) => ASSETS.find((asset) => asset.id === id).name,
    );
    $("scene-flowers").textContent = flowerNames.join(" · ");
    canvas.setAttribute(
      "aria-label",
      `${scene.name}：${flowerNames.join("、")}与草叶组成的微风草坪`,
    );
    canvas.dataset.scene = scene.id;
    canvas.dataset.assets = [...new Set(plants.map((plant) => plant.asset.id))].join(",");
    for (const item of SCENES)
      sceneButtons.get(item.id).setAttribute("aria-pressed", String(item.id === scene.id));
    draw();
  }
  function resize() {
    renderer.resize(stage.clientWidth, stage.clientHeight);
    updateScene();
    for (const item of SCENES) drawThumbnail(item, sceneButtons.get(item.id));
  }
  for (const item of SCENES) {
    const button = sceneButtons.get(item.id);
    button.disabled = false;
    button.addEventListener("click", () => {
      scene = item;
      history.replaceState(null, "", `#${item.id}`);
      updateScene();
      if (innerWidth < 640)
        $("scene-panel").scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  window.addEventListener("hashchange", () => {
    const selected = SCENES.find((item) => item.id === location.hash.slice(1));
    if (selected) {
      scene = selected;
      if (!isFeatured(scene)) previousScenes.open = true;
      updateScene();
    }
  });
  previousScenes.addEventListener("toggle", () => {
    if (previousScenes.open)
      for (const item of SCENES.filter((item) => !isFeatured(item)))
        drawThumbnail(item, sceneButtons.get(item.id));
  });
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
  preference.addEventListener("change", (event) => {
    paused = event.matches;
    playback();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail(new Error("图形上下文已丢失，请刷新页面。下方仍可查看独立素材。"));
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
