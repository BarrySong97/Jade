/**
 * @purpose 定义跑步和跳跃透明图集的采样区与身体注册点
 * @role 生成姿势与 Canvas 播放器之间的坐标契约
 * @deps cat-run-v1.png、cat-jump-v1.png（均 1774×887）
 * @gotcha 不按每帧高度缩放；跑步共用地平线，腾空帧按躯干注册，避免贴地滑行和体型抖动
 */
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
