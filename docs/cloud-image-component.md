# CloudImage 组件开发计划

## 概述

创建一个 React 组件，用于显示云端图片。组件能够：
1. 自动从 URL 解析图片尺寸
2. 根据尺寸设置 `aspect-ratio`，防止布局偏移 (CLS)
3. 显示 BlurHash 占位图，主图加载完成后淡入
4. 可选支持 Lightbox 查看原图

---

## URL 格式

### 命名规则

```
{basename}_{type}_{width}x{height}.{ext}
```

### 示例

| 变体 | URL |
|------|-----|
| 封面 | `photo_cover_1920x1080.webp` |
| 卡片 | `photo_card_800x600.webp` |
| 缩略图 | `photo_thumbnail_400x300.webp` |
| 正文配图 | `photo_content_1200x800.webp` |
| 原图 | `photo_original_2400x1600.webp` |
| BlurHash | `photo_blurhash.webp` |

### BlurHash URL 生成规则

去掉 `_{type}_{width}x{height}` 部分，替换为 `_blurhash`：

```
输入: https://cdn.example.com/photos/photo_cover_1920x1080.webp
输出: https://cdn.example.com/photos/photo_blurhash.webp
```

---

## 组件设计

### Props

```typescript
interface CloudImageProps {
  /** 图片 URL，需符合命名规则以解析尺寸 */
  src: string;

  /** 图片描述 */
  alt: string;

  /** 自定义样式类 */
  className?: string;

  /** 原图 URL，传入则启用 Lightbox 点击查看原图 */
  originalSrc?: string;

  /** 图片加载策略，默认 lazy */
  loading?: 'lazy' | 'eager';

  /** 是否禁用 BlurHash 占位 */
  disableBlurHash?: boolean;
}
```

### 组件行为

1. **解析 URL** - 从 `src` 提取 `width` 和 `height`
2. **设置比例** - 使用 `aspect-ratio: width/height` 预留空间
3. **加载占位图** - 先显示 BlurHash 小图（模糊效果）
4. **淡入主图** - 主图加载完成后淡入显示
5. **Lightbox** - 如果启用，点击打开原图查看器

---

## 文件结构

```
src/
├── lib/
│   └── cloud-image-utils.ts    # URL 解析工具函数
└── components/
    └── common/
        └── cloud-image.tsx     # 主组件
```

---

## 工具函数设计

### `src/lib/cloud-image-utils.ts`

```typescript
/** 解析后的图片 URL 信息 */
export interface ParsedCloudImageUrl {
  /** 完整的基础路径（不含文件名） */
  basePath: string;
  /** 图片基础名称 */
  basename: string;
  /** 图片类型：cover, card, thumbnail, content, original, blurhash */
  type: string;
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
  /** 文件扩展名 */
  ext: string;
}

/**
 * 解析云图片 URL
 * @param url 图片 URL
 * @returns 解析结果，无法解析时返回 null
 *
 * @example
 * parseCloudImageUrl('https://cdn.example.com/photos/photo_cover_1920x1080.webp')
 * // => { basePath: 'https://cdn.example.com/photos', basename: 'photo', type: 'cover', width: 1920, height: 1080, ext: 'webp' }
 */
export function parseCloudImageUrl(url: string): ParsedCloudImageUrl | null;

/**
 * 获取 BlurHash 占位图 URL
 * @param url 任意变体的图片 URL
 * @returns BlurHash 图片 URL
 *
 * @example
 * getBlurHashUrl('https://cdn.example.com/photos/photo_cover_1920x1080.webp')
 * // => 'https://cdn.example.com/photos/photo_blurhash.webp'
 */
export function getBlurHashUrl(url: string): string;
```

---

## 组件实现要点

### 1. URL 解析正则

```typescript
// 匹配: {basename}_{type}_{width}x{height}.{ext}
const pattern = /^(.+)_([a-z]+)_(\d+)x(\d+)\.(\w+)$/i;
```

### 2. 加载状态管理

```typescript
const [isLoaded, setIsLoaded] = useState(false);
const [hasError, setHasError] = useState(false);
```

### 3. 淡入动画

```css
.blur-placeholder {
  filter: blur(20px);
  transform: scale(1.1);
}

.main-image {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.main-image.loaded {
  opacity: 1;
}
```

### 4. 结构示意

```tsx
<div style={{ aspectRatio: `${width}/${height}` }}>
  {/* BlurHash 占位图 */}
  <img src={blurHashUrl} className="blur-placeholder" />

  {/* 主图 */}
  <img
    src={src}
    onLoad={() => setIsLoaded(true)}
    className={cn('main-image', isLoaded && 'loaded')}
  />
</div>
```

---

## 使用示例

### 基础用法

```tsx
<CloudImage
  src="https://cdn.example.com/photo_cover_1920x1080.webp"
  alt="示例图片"
/>
```

### 启用 Lightbox（点击查看原图）

```tsx
<CloudImage
  src="https://cdn.example.com/photo_card_800x600.webp"
  alt="示例图片"
  originalSrc="https://cdn.example.com/photo_original_2400x1600.webp"
/>
```

### 禁用 BlurHash

```tsx
<CloudImage
  src="https://cdn.example.com/photo_thumbnail_400x300.webp"
  alt="缩略图"
  disableBlurHash
/>
```

### 首屏图片（eager 加载）

```tsx
<CloudImage
  src="https://cdn.example.com/photo_cover_1920x1080.webp"
  alt="Hero 图片"
  loading="eager"
/>
```

---

## 错误处理

1. **URL 解析失败** - 无法提取尺寸时，不设置 `aspect-ratio`，图片自然显示
2. **BlurHash 加载失败** - 静默失败，直接显示主图
3. **主图加载失败** - 显示错误占位符或保持 BlurHash

---

## 后续扩展

- [ ] 支持 `srcset` 响应式图片
- [ ] 支持图片懒加载 Intersection Observer
- [ ] 支持自定义 Lightbox 组件
- [ ] 支持图片加载进度指示
