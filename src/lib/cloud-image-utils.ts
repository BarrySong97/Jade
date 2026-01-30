/** 解析后的图片 Key 信息 */
export interface ParsedCloudImageKey {
  /** 路径前缀（不含文件名） */
  pathPrefix: string;
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

// 匹配文件名: {basename}_{type}_{width}x{height}.{ext}
const FILENAME_PATTERN = /^(.+)_([a-z]+)_(\d+)x(\d+)\.(\w+)$/i;

/**
 * 解析云图片 Key
 * @param key 图片 Key（可包含路径）
 * @returns 解析结果，无法解析时返回 null
 *
 * @example
 * parseCloudImageKey('/blogs/2025/photo_cover_1920x1080.webp')
 * // => { pathPrefix: '/blogs/2025', basename: 'photo', type: 'cover', width: 1920, height: 1080, ext: 'webp' }
 */
export function parseCloudImageKey(key: string): ParsedCloudImageKey | null {
  // 分离路径和文件名
  const lastSlashIndex = key.lastIndexOf("/");
  const pathPrefix = lastSlashIndex >= 0 ? key.substring(0, lastSlashIndex) : "";
  const filename = lastSlashIndex >= 0 ? key.substring(lastSlashIndex + 1) : key;

  const match = filename.match(FILENAME_PATTERN);
  if (!match) {
    return null;
  }

  const [, basename, type, widthStr, heightStr, ext] = match;

  return {
    pathPrefix,
    basename,
    type,
    width: parseInt(widthStr, 10),
    height: parseInt(heightStr, 10),
    ext,
  };
}

/**
 * 根据图片 Key 生成 BlurHash Key
 * 格式：{pathPrefix}/{basename}_blurhash.{ext}
 * @param key 图片 Key
 * @returns BlurHash 图片 Key
 *
 * @example
 * getBlurHashKey('/blogs/2025/photo_cover_1920x1080.webp')
 * // => '/blogs/2025/photo_blurhash.webp'
 */
export function getBlurHashKey(key: string): string | null {
  const parsed = parseCloudImageKey(key);
  if (!parsed) {
    return null;
  }

  const { pathPrefix, basename, ext } = parsed;
  const blurHashFilename = `${basename}_blurhash.${ext}`;
  return pathPrefix ? `${pathPrefix.replace("/", "")}/${blurHashFilename}` : blurHashFilename;
}
