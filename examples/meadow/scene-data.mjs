/**
 * @purpose 花草素材目录与五种场景的确定性排布
 * @role 页面、缩略图和预览服务共享的数据模块
 * @deps 无；调用者传入包含图片及比例的素材对象
 * @gotcha 大图和缩略图共用排布；每种新花至少用于一景，低草不会遮住最矮的花头
 */
export const ASSETS = [
  { id: "flower-lily", name: "铃兰", note: "垂下的一串白色小铃铛", height: 164, fresh: true },
  { id: "flower-bell", name: "风铃草", note: "蓝紫色钟形花，细茎轻盈", height: 210, fresh: true },
  { id: "flower-forget", name: "勿忘草", note: "低处散落的细小蓝花", height: 110, fresh: true },
  { id: "flower-cosmos", name: "波斯菊", note: "浅粉花瓣，细碎羽状叶", height: 229, fresh: true },
  {
    id: "flower-columbine",
    name: "耧斗菜",
    note: "奶油色内瓣与紫色花距",
    height: 210,
    fresh: true,
  },
  { id: "flower-iris", name: "鸢尾", note: "层层折叠的蓝紫色花瓣", height: 246, fresh: true },
  { id: "flower-poppy", name: "虞美人", note: "珊瑚粉薄瓣，微微起皱", height: 213, fresh: true },
  { id: "flower-tulip", name: "郁金香", note: "玫瑰粉与浅杏色花杯", height: 190, fresh: true },
  { id: "grass-low", name: "低矮草丛", note: "连接底部的灰绿叶片", height: 110 },
  { id: "grass-tall", name: "细叶高草", note: "高低错落的细叶与草穗", height: 235 },
  { id: "flower-daisy", name: "白色雏菊", note: "原版 · 奶油白花瓣", height: 212 },
  { id: "flower-violet", name: "淡紫小花", note: "原版 · 细长的紫色花序", height: 192 },
  { id: "flower-yellow", name: "黄色野花", note: "原版 · 暖黄色点缀", height: 157 },
];
const assetInfo = Object.fromEntries(ASSETS.map((asset) => [asset.id, asset]));
export const SCENES = [
  {
    id: "woodland",
    code: "A",
    name: "林间白蓝",
    mood: "安静 · 疏朗 · 白与浅蓝",
    description: "铃兰藏在叶片间，蓝色小花散落在低处。花朵更轻，草叶留出呼吸的空隙。",
    flowers: ["flower-lily", "flower-bell", "flower-forget", "flower-lily", "flower-forget"],
    grassSpacing: 174,
    grassScale: 0.54,
    lowScale: 0.72,
    flowerSpacing: 147,
    seed: 0.2,
  },
  {
    id: "blush",
    code: "B",
    name: "粉色野花",
    mood: "轻盈 · 自然 · 粉与奶油白",
    description: "波斯菊和虞美人伸出草叶，细茎与薄花瓣轻轻摇动，穿插几朵熟悉的白雏菊。",
    flowers: ["flower-cosmos", "flower-poppy", "flower-cosmos", "flower-daisy", "flower-poppy"],
    grassSpacing: 150,
    grassScale: 0.76,
    lowScale: 0.76,
    flowerSpacing: 160,
    seed: 1.3,
  },
  {
    id: "violet",
    code: "C",
    name: "紫色花境",
    mood: "浓淡相间 · 花瓣轮廓鲜明",
    description: "鸢尾的折叠花瓣、耧斗菜的弯曲花距，加上低垂的风铃草，看看更丰富的轮廓。",
    flowers: ["flower-columbine", "flower-iris", "flower-bell", "flower-forget"],
    grassSpacing: 152,
    grassScale: 0.63,
    lowScale: 0.72,
    flowerSpacing: 139,
    seed: 2.1,
  },
  {
    id: "garden",
    code: "D",
    name: "春日花园",
    mood: "柔和 · 明快 · 粉杏与淡蓝",
    description: "杯状郁金香与舒展的波斯菊交替，脚边点缀勿忘草，像一小段春天的花园边缘。",
    flowers: ["flower-tulip", "flower-cosmos", "flower-tulip", "flower-forget"],
    grassSpacing: 196,
    grassScale: 0.43,
    lowScale: 0.67,
    flowerSpacing: 132,
    seed: 3.2,
  },
  {
    id: "original",
    code: "E",
    name: "原版花草",
    mood: "原版对照 · 更浓密的草地",
    description: "保留第一版的白雏菊、淡紫小花和黄色野花，方便与新花型和不同疏密直接比较。",
    flowers: [
      "flower-daisy",
      "flower-yellow",
      "flower-violet",
      "flower-daisy",
      "flower-violet",
      "flower-yellow",
    ],
    grassSpacing: 106,
    grassScale: 1,
    lowScale: 1,
    flowerSpacing: 123,
    seed: 0,
  },
];
export function arrangeScene(scene, width, height, byId) {
  const scale = Math.min(1, height / 340, width < 640 ? 0.77 : 1);
  const baseline = height + 8 * scale;
  const plants = [];
  const add = (id, x, plantHeight, variant, layer, inspect = false) =>
    plants.push({
      asset: byId[id],
      x,
      base: baseline + layer * scale,
      height: plantHeight * scale,
      flip: variant % 2 === 0,
      phase: Math.sin(variant * 1.7 + scene.seed) * 0.65 + x * 0.0018,
      stiffness: id.startsWith("flower") ? 0.65 : 1,
      inspect,
    });
  const grassSpacing = scene.grassSpacing * scale;
  for (let i = -1; i * grassSpacing < width + grassSpacing; i++) {
    const x = i * grassSpacing + Math.sin(i * 2.3 + scene.seed) * 23 * scale;
    const mound = 0.5 + 0.5 * Math.sin(i * 1.4 + scene.seed + 0.8);
    add("grass-tall", x, (158 + mound * 102) * scene.grassScale, i, 0, i % 5 === 2);
  }
  const lowSpacing = 88 * scale;
  for (let i = -1; i * lowSpacing < width + lowSpacing; i++) {
    add("grass-low", i * lowSpacing, (91 + (Math.sin(i * 2.8) + 1) * 17) * scene.lowScale, i, 9);
  }
  const flowerSpacing = scene.flowerSpacing * scale;
  for (let i = 0; i * flowerSpacing < width + flowerSpacing; i++) {
    const id = scene.flowers[i % scene.flowers.length];
    const x = 40 * scale + i * flowerSpacing + Math.sin(i * 1.8 + scene.seed) * 21 * scale;
    add(id, x, assetInfo[id].height + Math.sin(i * 2.7 + scene.seed) * 20, i + 3, 5, i % 3 === 0);
  }
  const frontSpacing = 73 * scale;
  for (let i = -1; i * frontSpacing < width + frontSpacing; i++) {
    add(
      "grass-low",
      i * frontSpacing + 21 * scale,
      (53 + (Math.sin(i * 1.9) + 1) * 13) * scene.lowScale,
      i + 1,
      16,
    );
  }
  return plants;
}
