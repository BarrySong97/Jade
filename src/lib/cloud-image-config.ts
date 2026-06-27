/**
 * @purpose 云图片配置：CDN 域名常量与「Key 拼接为完整 URL」函数
 * @role    云图片模块基础设施，被 cloud-image 组件及相关工具引用以生成图片地址
 * @deps    无外部依赖；与 cloud-image-utils.ts 配套
 * @gotcha  域名硬编码为 blogassets.4real.ink，更换 CDN 需改此处；详见 docs/cloud-image-component.md、docs/cloud-image-upload-spec.md
 */

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
