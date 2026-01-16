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

// 匹配: {basename}_{type}_{width}x{height}.{ext}
const URL_PATTERN = /^(.+)_([a-z]+)_(\d+)x(\d+)\.(\w+)$/i;

/**
 * 解析云图片 URL
 * @param url 图片 URL
 * @returns 解析结果，无法解析时返回 null
 *
 * @example
 * parseCloudImageUrl('https://cdn.example.com/photos/photo_cover_1920x1080.webp')
 * // => { basePath: 'https://cdn.example.com/photos', basename: 'photo', type: 'cover', width: 1920, height: 1080, ext: 'webp' }
 */
export function parseCloudImageUrl(url: string): ParsedCloudImageUrl | null {
  // 分离路径和文件名
  const lastSlashIndex = url.lastIndexOf('/');
  const basePath = lastSlashIndex >= 0 ? url.substring(0, lastSlashIndex) : '';
  const filename = lastSlashIndex >= 0 ? url.substring(lastSlashIndex + 1) : url;

  const match = filename.match(URL_PATTERN);
  if (!match) {
    return null;
  }

  const [, basename, type, widthStr, heightStr, ext] = match;

  return {
    basePath,
    basename,
    type,
    width: parseInt(widthStr, 10),
    height: parseInt(heightStr, 10),
    ext,
  };
}

/**
 * 获取 BlurHash 占位图 URL
 * @param url 任意变体的图片 URL
 * @returns BlurHash 图片 URL
 *
 * @example
 * getBlurHashUrl('https://cdn.example.com/photos/photo_cover_1920x1080.webp')
 * // => 'https://cdn.example.com/photos/photo_blurhash.webp'
 */
export function getBlurHashUrl(url: string): string {
  const parsed = parseCloudImageUrl(url);
  if (!parsed) {
    // 无法解析时，尝试简单替换
    return url.replace(/_[a-z]+_\d+x\d+\./i, '_blurhash.');
  }

  const { basePath, basename, ext } = parsed;
  return basePath ? `${basePath}/${basename}_blurhash.${ext}` : `${basename}_blurhash.${ext}`;
}
