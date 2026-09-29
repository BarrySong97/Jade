/**
 * @purpose 定义博客系列的稳定 URL 标识与展示名称
 * @role 内容 schema、文章头部与系列归档共享的系列目录
 * @deps 无外部依赖
 * @gotcha 新增系列时同步 SERIES_IDS 与 SERIES；文章通过 frontmatter series 加入系列
 */
export const SERIES_IDS = ["stock-trading"] as const;

export const SERIES: Record<(typeof SERIES_IDS)[number], { title: string; description: string }> = {
  "stock-trading": {
    title: "炒股日记",
    description: "记录炒股过程中的经历、心态与反思。",
  },
};
