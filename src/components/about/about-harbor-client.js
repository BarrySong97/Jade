/**
 * @purpose About 海港的按需加载、播放与资源清理
 * @role 自定义元素生命周期，适配 Astro ClientRouter
 * @deps harbor-renderer.js、lib/harbor-scene.mjs
 * @gotcha 异步完成检查 AbortSignal；屏外/后台/减少动态停表；断开清理所有观察器和帧
 */
import { drawHarbor } from "./harbor-renderer.js";
import { sceneLayout } from "../../lib/harbor-scene.mjs";

export function defineAboutHarbor() {
  if (customElements.get("about-harbor")) return;
  customElements.define(
    "about-harbor",
    class extends HTMLElement {
      connectedCallback() {
        if (this.dispose) return;
        const controller = new AbortController();
        const { signal } = controller;
        const canvas = this.querySelector("canvas");
        const fallback = this.querySelector("[data-harbor-fallback]");
        const context = canvas.getContext("2d");
        const reduced = matchMedia("(prefers-reduced-motion: reduce)");
        let images,
          layout,
          frame = 0,
          previous = null,
          time = 2.5;
        let visible = false,
          loading = false,
          active = true;
        const draw = () => {
          if (!images || !layout || signal.aborted) return;
          drawHarbor(context, images, layout, time, devicePixelRatio);
          this.dataset.time = time.toFixed(3);
        };
        const tick = (now) => {
          if (previous !== null) time += Math.min((now - previous) / 1000, 0.08);
          previous = now;
          draw();
          frame = requestAnimationFrame(tick);
        };
        const playback = () => {
          cancelAnimationFrame(frame);
          previous = null;
          if (!images || signal.aborted) return;
          draw();
          const running = visible && !document.hidden && !reduced.matches && active;
          this.dataset.motion = running ? "playing" : "paused";
          if (running) frame = requestAnimationFrame(tick);
        };
        const resize = () => {
          layout = sceneLayout(this.clientWidth, this.clientHeight);
          const dpr = Math.min(devicePixelRatio || 1, 2);
          canvas.width = Math.round(layout.width * dpr);
          canvas.height = Math.round(layout.height * dpr);
          playback();
        };
        const resizeObserver = new ResizeObserver(resize);
        const start = async () => {
          if (loading || signal.aborted) return;
          loading = true;
          try {
            if (!context) throw new Error("Canvas unavailable");
            const loaded = await Promise.all(
              JSON.parse(this.dataset.assets).map(
                (src) =>
                  new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = src;
                  }),
              ),
            );
            if (signal.aborted) return;
            images = loaded;
            resize();
            canvas.hidden = false;
            fallback.hidden = true;
            this.dataset.state = "ready";
            resizeObserver.observe(this);
          } catch {
            if (!signal.aborted) this.dataset.state = "static";
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
        document.addEventListener("visibilitychange", playback, { signal });
        reduced.addEventListener("change", playback, { signal });
        window.addEventListener(
          "pagehide",
          () => {
            active = false;
            playback();
          },
          { signal },
        );
        window.addEventListener(
          "pageshow",
          () => {
            active = true;
            playback();
          },
          { signal },
        );
        this.dispose = () => {
          controller.abort();
          cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          loadObserver.disconnect();
          visibleObserver.disconnect();
          canvas.hidden = true;
          fallback.hidden = false;
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
