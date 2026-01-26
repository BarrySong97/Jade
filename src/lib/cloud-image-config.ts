/** 云图片 CDN 域名 */
export const CLOUD_IMAGE_DOMAIN = "https://blogassets.4real.ink";

/**
 * 根据图片 Key 生成完整的图片 URL
 * @param key 图片 Key（如：/cover/photo_cover_1920x1080.webp）
 * @returns 完整的图片 URL
 */
export function getCloudImageUrl(key: string): string {
  return `${CLOUD_IMAGE_DOMAIN}${key}`;
}
