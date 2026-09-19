/**
 * @purpose 注册追蝶新增姿势及复用图集的地面/足部锚点
 * @role 完整场景的素材坐标契约，不改变独立猫/蝴蝶画板
 * @deps cat-atlas.mjs、butterfly-motion.mjs、三张原始透明图集
 * @gotcha 整张图集统一缩放；足部锚点不等于可见轮廓中心，不按单帧裁切重算尺寸
 */
import { CAT_ATLASES } from "../cat/cat-atlas.mjs";
import { BUTTERFLY_ATLAS } from "../butterfly/butterfly-motion.mjs";

function atlas(file, span, anchors) {
  return {
    file,
    width: 1774,
    height: 887,
    maxWidth: span,
    frames: anchors.map((anchor, i) => {
      const x = Math.round((i % 4) * 443.5);
      const y = Math.round(Math.floor(i / 4) * 443.5);
      return {
        anchor,
        rect: [
          x,
          y,
          Math.round(((i % 4) + 1) * 443.5) - x,
          Math.round((Math.floor(i / 4) + 1) * 443.5) - y,
        ],
      };
    }),
  };
}

export const CHASE_ATLASES = {
  ...Object.fromEntries(
    ["run", "jump", "gait", "prepare", "turn"].map((id) => [
      id,
      { ...CAT_ATLASES[id], file: `/cat/${CAT_ATLASES[id].file}` },
    ]),
  ),
  stalk: atlas("/chase/cat-stalk-v1.png", 340, [
    [224, 377],
    [228, 375],
    [211, 372],
    [203, 378],
    [228, 319],
    [233, 321],
    [214, 321],
    [204, 320],
  ]),
  dash: atlas("/chase/cat-dash-v1.png", 320, [
    [228, 360],
    [225, 360],
    [228, 361],
    [228, 362],
    [228, 311],
    [226, 308],
    [222, 324],
    [215, 354],
  ]),
  wing: {
    ...BUTTERFLY_ATLAS,
    file: `/butterfly/${BUTTERFLY_ATLAS.file}`,
    maxWidth: BUTTERFLY_ATLAS.span,
    frames: BUTTERFLY_ATLAS.frames.map((frame) => ({
      ...frame,
      anchor: [frame.anchor[0], frame.anchor[1] + 80],
    })),
  },
  perch: atlas("/chase/butterfly-perch-v1.png", 370, [
    [235, 396],
    [239, 396],
    [224, 396],
    [220, 395],
    [237, 338],
    [238, 338],
    [226, 329],
    [222, 323],
  ]),
};

export function spriteTransform(pose, unit) {
  const atlas = CHASE_ATLASES[pose.sheet];
  return {
    ...atlas.frames[pose.frame],
    scale: (unit * (pose.butterfly ? 0.38 : 2.05)) / atlas.maxWidth,
    x: pose.x,
    y: pose.y,
    direction: pose.direction ?? 1,
    angle: pose.angle ?? 0,
  };
}

export function projectSprite([x, y], transform) {
  const dx = (x - transform.anchor[0]) * transform.scale * transform.direction;
  const dy = (y - transform.anchor[1]) * transform.scale;
  return [
    transform.x + dx * Math.cos(transform.angle) - dy * Math.sin(transform.angle),
    transform.y + dx * Math.sin(transform.angle) + dy * Math.cos(transform.angle),
  ];
}
