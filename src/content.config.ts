/**
 * @purpose 定义 Astro `blog` 内容集合：加载 src/content/blog 下 md/mdx 并用 zod 校验 frontmatter
 * @role    内容层 schema 入口，Astro 构建时读取，getCollection("blog") 据此提供类型化文章数据
 * @deps    astro:content（defineCollection/z）、astro/loaders（glob）
 * @gotcha  frontmatter 字段（title/description/pubDate 等）须符合此 schema，否则构建报错；pubDate/updatedDate 由字符串 coerce 为 Date
 */

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.string().optional(),
      // 由 scripts/img.mjs 处理封面后写入,供 BlogImage 做 blur-up 占位
      heroWidth: z.number().optional(),
      heroHeight: z.number().optional(),
      heroThumbhash: z.string().optional(),
      coverImage: z.string().optional(),
    }),
});

export const collections = { blog };
