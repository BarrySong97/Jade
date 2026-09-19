/**
 * @purpose 为首页草甸提供可见时运行的微风动画
 * @role 自定义元素生命周期，支持 Astro ClientRouter 进入/离开首页
 * @deps meadow-renderer.js、meadow-layout.mjs、ResizeObserver、IntersectionObserver
 * @gotcha 异步加载必须检查 AbortSignal；断开元素时取消帧、监听器和 GPU 资源
 */
import { createRenderer, loadPlant } from "./meadow-renderer.js";
import { arrangeNaturalMeadow } from "../../lib/meadow-layout.mjs";

export function defineHomeMeadow() {
  if (customElements.get("home-meadow")) return;
  customElements.define(
    "home-meadow",
    class extends HTMLElement {
      connectedCallback() {
        if (this.dispose) return;
        const controller = new AbortController();
        const { signal } = controller;
        const canvas = this.querySelector("canvas");
        const fallback = this.querySelector("[data-meadow-fallback]");
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
        let renderer;
        let plants = [];
        let frame = 0;
        let time = 1.1;
        let previous = null;
        let visible = false;
        let loading = false;
        let failed = false;
        let pageActive = true;
        const draw = () => renderer?.draw(plants, time, reducedMotion.matches ? 0 : 0.45, false);
        const tick = (timestamp) => {
          if (previous !== null) time += Math.min((timestamp - previous) / 1000, 0.05);
          previous = timestamp;
          draw();
          frame = requestAnimationFrame(tick);
        };
        const playback = () => {
          cancelAnimationFrame(frame);
          previous = null;
          if (!renderer || failed || signal.aborted) return;
          draw();
          const running = visible && !document.hidden && !reducedMotion.matches && pageActive;
          this.dataset.motion = running ? "playing" : "paused";
          if (running) frame = requestAnimationFrame(tick);
        };
        const fail = () => {
          failed = true;
          cancelAnimationFrame(frame);
          canvas.hidden = true;
          fallback.style.display = "";
          this.dataset.state = "static";
          this.dataset.motion = "paused";
        };
        const resizeObserver = new ResizeObserver(() => {
          if (!renderer || failed) return;
          const byId = renderer.byId;
          plants = arrangeNaturalMeadow({ seed: 5.6 }, this.clientWidth, this.clientHeight, byId);
          renderer.resize(this.clientWidth, this.clientHeight);
          playback();
        });
        const start = async () => {
          if (loading || signal.aborted) return;
          loading = true;
          try {
            const sources = JSON.parse(this.dataset.assets);
            const assets = await Promise.all(sources.map(({ id, src }) => loadPlant(id, src)));
            if (signal.aborted) return;
            renderer = createRenderer(canvas, null, assets);
            renderer.byId = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
            plants = arrangeNaturalMeadow(
              { seed: 5.6 },
              this.clientWidth,
              this.clientHeight,
              renderer.byId,
            );
            renderer.resize(this.clientWidth, this.clientHeight);
            draw();
            canvas.hidden = false;
            fallback.style.display = "none";
            this.dataset.state = "ready";
            resizeObserver.observe(this);
            playback();
          } catch {
            if (!signal.aborted) fail();
          }
        };
        const loadObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              loadObserver.disconnect();
              start();
            }
          },
          { rootMargin: "250px" },
        );
        const visibleObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          playback();
        });
        canvas.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            fail();
          },
          { signal },
        );
        reducedMotion.addEventListener("change", playback, { signal });
        document.addEventListener("visibilitychange", playback, { signal });
        window.addEventListener(
          "pagehide",
          () => {
            pageActive = false;
            playback();
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
        this.dispose = () => {
          controller.abort();
          cancelAnimationFrame(frame);
          loadObserver.disconnect();
          visibleObserver.disconnect();
          resizeObserver.disconnect();
          renderer?.destroy();
          canvas.hidden = true;
          fallback.style.display = "";
        };
        loadObserver.observe(this);
        visibleObserver.observe(this);
      }
      disconnectedCallback() {
        this.dispose?.();
        this.dispose = null;
      }
    },
  );
}
