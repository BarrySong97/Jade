/**
 * @purpose 渲染通栏工业港口、水平货船和走动工人
 * @role About 与 Demo 共享 Canvas 2D 真源
 * @deps lib/harbor-scene.mjs、按 ASSET_NAMES 排序的素材
 * @gotcha 仅绘制不管理时钟或控件；两岸等比、中段延展
 */
import {
  GULL_ATLAS,
  gullRect,
  sampleBoat,
  sampleGull,
  sampleWorker,
  shipyardLayout,
} from "../../lib/harbor-scene.mjs";
export function drawHarbor(context, images, layout, time, pixelRatio = 1) {
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
    const h = (w * images[1].height) / images[1].width;
    context.drawImage(images[1], -w * 0.5, -h * 0.75, w, h);
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

  const dpr = Math.min(pixelRatio || 1, 2);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);
  // 只延展无建筑的中央海面，保持两端港口/海岸的比例与小尺寸。
  const background = images[0];
  // 用原画中央的纯海水铺底，覆盖原插画下沿/两角的透明收边，真正贴满页脚。
  const waterTop = layout.top + layout.plateHeight * 0.64;
  context.drawImage(
    background,
    background.width * 0.43,
    background.height * 0.64,
    background.width * 0.3,
    background.height * 0.23,
    0,
    waterTop,
    layout.width,
    layout.height - waterTop,
  );
  const leftWidth = layout.artWidth * 0.4;
  const rightWidth = layout.artWidth * 0.2;
  for (const [sx, sw, dx, dw] of [
    [0, 0.4, 0, leftWidth],
    [0.4, 0.4, leftWidth, layout.width - leftWidth - rightWidth],
    [0.8, 0.2, layout.width - rightWidth, rightWidth],
  ]) {
    context.drawImage(
      background,
      sx * background.width,
      0,
      sw * background.width,
      background.height,
      dx,
      layout.top,
      dw,
      layout.plateHeight,
    );
  }
  const yard = shipyardLayout(layout);
  context.drawImage(images[3], yard.x, yard.y, yard.width, yard.height);
  for (let i = 0; i < 3; i++) {
    const worker = sampleWorker(time, i, yard);
    const cellWidth = images[4].width / 4;
    const cellHeight = images[4].height / 2;
    const h = worker.height;
    const w = (h * cellWidth) / cellHeight;
    context.save();
    context.translate(worker.x, worker.y);
    context.scale(worker.direction, 1);
    context.drawImage(
      images[4],
      (worker.frame % 4) * cellWidth,
      Math.floor(worker.frame / 4) * cellHeight,
      cellWidth,
      cellHeight,
      -w * 0.5,
      -h * (worker.frame < 4 ? 0.93 : 0.887),
      w,
      h,
    );
    context.restore();
  }
  const boat = sampleBoat(time, layout);
  drawBoat(boat);
  for (let i = 2; i >= 0; i--) drawGull(sampleGull(time, i, layout));

  return boat;
}
