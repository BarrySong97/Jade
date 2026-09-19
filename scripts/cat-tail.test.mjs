/**
 * @purpose 验证猫尾巴形变的连接稳定性和动作边界
 * @role 接入 pnpm test:meadow 的 Node 动作回归
 * @deps node:test、node:assert、tail-motion.mjs
 * @gotcha 验证固定根部、零幅度与休息段，不代替实际浏览器的视觉检查
 */
import test from "node:test";
import assert from "node:assert/strict";
import { deformTailPoint, TAIL_CYCLE } from "../examples/meadow/cat/tail-motion.mjs";

test("尾根连接区域在所有幅度和时间保持固定", () => {
  for (const time of [0, 0.5, 2.3, 4.5, 6, 60]) {
    for (const amplitude of [0, 0.6, 1]) {
      for (const x of [110, 200, 270, 290])
        assert.deepEqual(deformTailPoint(x, 1015, time, amplitude), [x, 1015]);
    }
  }
});

test("零幅度和休息段准确回到原图，不把尾尖压进地面", () => {
  for (const x of [290, 400, 550, 700]) {
    assert.deepEqual(deformTailPoint(x, 1200, 2, 0), [x, 1200]);
    assert.deepEqual(deformTailPoint(x, 1200, 5.5, 1), [x, 1200]);
    for (let time = 0; time < TAIL_CYCLE * 2; time += 0.1) {
      const [nextX, nextY] = deformTailPoint(x, 1200, time, 1);
      assert.ok(Math.abs(nextX - x) <= 24);
      assert.ok(nextY <= 1200 && nextY >= 1090);
    }
  }
});

test("尾尖随时间变化，循环边界连续且顶点不翻折", () => {
  assert.notDeepEqual(deformTailPoint(680, 1160, 1, 0.6), deformTailPoint(680, 1160, 3, 0.6));
  const [x, y] = deformTailPoint(680, 1160, TAIL_CYCLE - 0.0001, 1);
  const [nextX, nextY] = deformTailPoint(680, 1160, TAIL_CYCLE + 0.0001, 1);
  assert.ok(Math.hypot(x - nextX, y - nextY) < 0.001);
  for (let time = 0; time < TAIL_CYCLE; time += 0.2) {
    let last = -Infinity;
    for (let sourceX = 100; sourceX <= 730; sourceX += 5) {
      const [deformedX] = deformTailPoint(sourceX, 1100, time, 1);
      assert.ok(deformedX > last, "网格列不能翻折");
      last = deformedX;
    }
  }
});
