/**
 * @purpose 注册首页两色蝴蝶的振翅与停驻图集
 * @role 构建期静态回退与客户端采样共用的原图坐标契约
 * @deps 四张 1774×887、4 列 2 行的透明 PNG
 * @gotcha 锚点为足部接触点；压缩图片后仍用原图坐标归一化，不能重新裁切每帧
 */
const wings = [
  [236, 365],
  [237, 365],
  [232, 365],
  [222, 365],
  [237, 318],
  [237, 318],
  [235, 318],
  [224, 320],
];
const feet = [
  [235, 396],
  [239, 396],
  [224, 396],
  [220, 395],
  [237, 338],
  [238, 338],
  [226, 329],
  [222, 323],
];
function atlas(id, anchors, span) {
  return {
    id,
    width: 1774,
    height: 887,
    span,
    frames: anchors.map((anchor, i) => {
      const x = Math.round((i % 4) * 443.5),
        y = Math.round(Math.floor(i / 4) * 443.5);
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
export const BUTTERFLY_ATLASES = {
  "amber-wing": atlas("amber-wing", wings, 336),
  "amber-perch": atlas("amber-perch", feet, 370),
  "blue-wing": atlas("blue-wing", wings, 336),
  "blue-perch": atlas("blue-perch", feet, 370),
};

export function butterflySprite(pose) {
  const atlas = BUTTERFLY_ATLASES[pose.id],
    { rect, anchor } = atlas.frames[pose.frame];
  const scale = pose.span / atlas.span;
  return {
    ...pose,
    rect: [
      pose.x - anchor[0] * scale,
      pose.y - anchor[1] * scale,
      rect[2] * scale,
      rect[3] * scale,
    ],
    crop: [
      rect[0] / atlas.width,
      rect[1] / atlas.height,
      rect[2] / atlas.width,
      rect[3] / atlas.height,
    ],
  };
}
