/**
 * @purpose 用不规则群落与连续疏密变化生成自然草甸
 * @role 独立于渲染器的确定性排布，替换等距点位的小幅抖动
 * @deps 由调用者传入素材目录与旧版同视口排布
 * @gotcha 总株数为旧版的 90%；随机数只在排布时生成，动画帧不能重新抽样
 */
export function arrangeNaturalMeadow(scene, width, height, byId, reference) {
  const scale = Math.min(1, height / 340, width < 640 ? 0.77 : 1);
  const span = width / scale;
  let state = Math.round(scene.seed * 10000);
  const random = () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (items) => items[Math.floor(random() * items.length)];
  const range = (low, high) => low + random() * (high - low);
  const target = Math.round(reference.length * 0.9);
  const grassCount = Math.round(
    reference.filter((plant) => plant.asset.id.startsWith("grass")).length * 0.9,
  );
  const species = [
    "flower-daisy",
    "flower-yellow",
    "flower-forget",
    "flower-daisy",
    "flower-violet",
    "flower-yellow",
    "flower-bell",
    "flower-cosmos",
  ];
  const patchCount = Math.max(3, Math.round(span / 230));
  const patches = [];
  for (let i = 0; i < patchCount; i++) {
    let x = range(0, span);
    // 只限制群落中心过度挤在一起，不按格子或固定宽度分段。
    for (
      let attempt = 0;
      attempt < 20 && patches.some((patch) => Math.abs(patch.x - x) < 65);
      attempt++
    )
      x = range(0, span);
    patches.push({
      x,
      radius: range(55, 175),
      strength: range(0.45, 1),
      species: species[i % species.length],
      height: range(115, 168),
      base: range(-12, 9),
    });
  }
  const field = (x) =>
    patches.reduce(
      (sum, patch) => sum + patch.strength * Math.exp(-(((x - patch.x) / patch.radius) ** 2)),
      0,
    );
  const plants = [];
  const add = (id, x, plantHeight, depth, layer, inspect = false) => {
    plants.push({
      asset: byId[id],
      x: x * scale,
      base: height + (8 + depth) * scale,
      height: plantHeight * scale,
      flip: random() < 0.5,
      phase: range(-0.8, 0.8) + x * 0.0018,
      stiffness: id.startsWith("flower") ? 0.65 : 1,
      inspect,
      layer,
    });
  };
  for (let i = 0; i < grassCount; i++) {
    const layer = i < grassCount * 0.48 ? 0 : i < grassCount * 0.75 ? 1 : 3;
    let x = range(-20, span + 20);
    if (layer !== 3) {
      // 花较少的地方仍有草；场的宽缓变化让疏密跨越多株植物。
      for (let attempt = 0; attempt < 20 && random() > 0.48 + 0.4 / (1 + field(x)); attempt++)
        x = range(-20, span + 20);
    }
    const id =
      layer === 0
        ? pick(["grass-wispy", "grass-wispy", "grass-tall", "grass-arching"])
        : pick(["grass-arching", "grass-arching", "grass-low", "grass-wispy"]);
    let plantHeight = layer === 0 ? range(116, 220) : layer === 1 ? range(69, 119) : range(43, 75);
    // 无穗草按叶片尺度匹配旧草，不能按带高穗的全株高度放大。
    if (layer === 0 && id === "grass-arching") plantHeight *= 0.58;
    if (layer === 0 && id === "grass-wispy") plantHeight *= 0.78;
    add(id, x, plantHeight, layer === 0 ? range(-7, 5) : range(10, 28), layer, i % 19 === 0);
  }
  for (let i = grassCount; i < target; i++) {
    const clustered = random() < 0.79;
    const patch = pick(patches);
    let x = range(0, span);
    if (clustered) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const candidate = patch.x + (random() + random() - 1) * patch.radius;
        if (candidate >= 0 && candidate <= span) {
          x = candidate;
          break;
        }
      }
    }
    let id = clustered && random() < 0.73 ? patch.species : pick(species);
    if (id === "flower-daisy" && random() < 0.52) id = "flower-daisy-side";
    const stature =
      id === "flower-forget"
        ? 0.66
        : id === "flower-yellow"
          ? 0.82
          : id === "flower-cosmos"
            ? 0.85
            : 1;
    const plantHeight = (clustered ? patch.height : range(94, 171)) * stature * range(0.72, 1.2);
    add(
      id,
      x,
      plantHeight,
      (clustered ? patch.base : range(-18, 19)) + range(-9, 9),
      2,
      i % 17 === 0,
    );
  }
  // 相近根部的高株先画，矮株在前；不是把每一朵都完整展示出来。
  return plants.sort((a, b) => a.layer - b.layer || a.base - b.base || b.height - a.height);
}
