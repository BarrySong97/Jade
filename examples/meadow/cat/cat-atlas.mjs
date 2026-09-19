/**
 * @purpose 定义跑跳和四组过渡透明图集的采样区与身体注册点
 * @role 生成姿势、关节标注与 Canvas 播放器之间的共同坐标契约
 * @deps 六张 cat-*-v1.png 图集（均 1774×887）、tail-motion.mjs
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
    label: "跑步",
    file: "cat-run-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 400,
    frames: frames(Array.from({ length: 8 }, () => [220, 353])),
  },
  jump: {
    label: "跳跃",
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
  rise: {
    label: "坐站过渡",
    file: "cat-rise-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 450,
    frames: frames([
      [270, 414],
      [255, 409],
      [250, 406],
      [240, 406],
      [238, 349],
      [228, 350],
      [220, 350],
      [215, 349],
    ]),
  },
  gait: {
    label: "起跑收步",
    file: "cat-gait-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 450,
    frames: frames([
      [218, 398],
      [211, 396],
      [213, 390],
      [213, 393],
      [219, 344],
      [213, 342],
      [214, 343],
      [214, 344],
    ]),
  },
  prepare: {
    label: "蓄力恢复",
    file: "cat-prepare-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 325,
    frames: frames([
      [219, 365],
      [224, 367],
      [211, 370],
      [206, 370],
      [231, 333],
      [222, 329],
      [210, 328],
      [197, 329],
    ]),
  },
  turn: {
    label: "转身",
    file: "cat-turn-v1.png",
    width: 1774,
    height: 887,
    maxWidth: 402,
    frames: frames([
      [215, 390],
      [222, 392],
      [232, 390],
      [204, 392],
      [232, 357],
      [258, 355],
      [255, 355],
      [237, 352],
    ]),
  },
};

export function catPoseTransform(layout, motion, tailStudy = false) {
  const study = motion.study ?? Number(tailStudy);
  const center = layout.width / 2 + motion.x * layout.travel * (1 - study);
  if (motion.sheet === "idle") {
    const regular = layout.unit * 1.35;
    const size = regular + study * (Math.min(layout.width - 32, layout.height - 64, 390) - regular);
    return {
      origin: [center, layout.ground],
      anchor: [CAT_SIZE / 2, 1244],
      scale: size / CAT_SIZE,
      direction: motion.direction,
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
