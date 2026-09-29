/**
 * @purpose 定义博客系列的稳定 URL 标识、展示名称与可选封面
 * @role 内容 schema、文章头部与系列归档共享的系列目录
 * @deps 无外部依赖
 * @gotcha 新增系列时同步 SERIES_IDS 与 SERIES；文章通过 frontmatter series 加入系列；heroImage 可省略，不自动取文章封面
 */
export const SERIES_IDS = ["stock-trading"] as const;

export interface Series {
  title: string;
  description: string;
  /** 完整图片 URL 或 public 下以 / 开头的路径；省略时不显示封面 */
  heroImage?: string;
  heroWidth?: number;
  heroHeight?: number;
  heroThumbhash?: string;
}

export const SERIES: Record<(typeof SERIES_IDS)[number], Series> = {
  "stock-trading": {
    title: "炒股日记",
    description: "记录炒股过程中的经历、心态与反思。",
  },
};
