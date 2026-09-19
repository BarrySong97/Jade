/**
 * @purpose 定义跑步和跳跃透明图集的采样区与身体注册点
 * @role 生成姿势、关节标注与 Canvas 播放器之间的共同坐标契约
 * @deps cat-run-v1.png、cat-jump-v1.png（均 1774×887）、tail-motion.mjs
 * @gotcha 不按每帧高度缩放；跑步共用地平线，腾空帧按躯干注册，避免贴地滑行和体型抖动
 */
import { CAT_SIZE } from "./tail-motion.mjs";
function frames(anchors) {
  return anchors.map((anchor, i) => {
    const x = Math.round((i % 4) * 443.5);
    const y = Math.round(Math.floor(i / 4) * 443.5);
    const right = Math.round(((i % 4) + 1) * 443.5);
    const bottom = Math.round((Math.floor(i / 4) + 1) * 443.5);
    return { rect: [x, y, right - x, bottom - y], anchor };
  });
}

export const CAT_ATLASES = {
  run: {
    file: "cat-run-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 400,
    frames: frames(Array.from({ length: 8 }, () => [220, 353])),
  },
  jump: {
    file: "cat-jump-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 400,
    frames: frames([
      [219, 410],
      [216, 404],
      [217, 407],
      [205, 426],
      [241, 360],
      [238, 337],
      [203, 331],
      [204, 334],
    ]),
  },
};

export function catPoseTransform(layout, motion, tailStudy = false) {
  const center = layout.width / 2 + motion.x * layout.travel;
  if (motion.sheet === "idle") {
    const size = tailStudy
      ? Math.min(layout.width - 32, layout.height - 64, 390)
      : layout.unit * 1.35;
    return {
      origin: [center, layout.ground],
      anchor: [CAT_SIZE / 2, 1244],
      scale: size / CAT_SIZE,
      direction: 1,
    };
  }
  const atlas = CAT_ATLASES[motion.sheet];
  return {
    origin: [center, layout.ground - motion.lift * layout.unit],
    anchor: atlas.frames[motion.frame].anchor,
    scale: (layout.unit * 2.05) / atlas.maxWidth,
    direction: motion.direction,
  };
}

export function projectCatPoint([x, y], transform) {
  return [
    transform.origin[0] + (x - transform.anchor[0]) * transform.scale * transform.direction,
    transform.origin[1] + (y - transform.anchor[1]) * transform.scale,
  ];
}
