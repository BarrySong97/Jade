import { CloudImage } from "@/components/common/cloud-image";

export interface LatestArticlesSectionProps {
  posts: Array<{
    id: string;
    title: string;
    description: string;
    coverImage?: string;
  }>;
  postCountByYear: Record<number, number>;
}

export default function LatestArticlesSection({
  posts,
  postCountByYear,
}: LatestArticlesSectionProps) {
  // 按年份降序排列
  const sortedYears = Object.keys(postCountByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <section className="space-y-6 px-10 py-16">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">最新文章</h2>
        <div className="flex flex-wrap gap-2">
          {sortedYears.map((year) => (
            <span
              key={year}
              className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {year} 年共 {postCountByYear[year]} 篇文章
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <a
            key={index}
            href={`/blogs/${post.id}`}
            className="group block overflow-hidden rounded-lg border border-border"
          >
            {/* 封面图片 */}
            <div className="aspect-4/3 w-full overflow-hidden bg-muted">
              {post.coverImage ? (
                <CloudImage
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <span className="text-sm">暂无封面</span>
                </div>
              )}
            </div>

            {/* 内容区域 */}
            <div className="space-y-2 p-4">
              <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {post.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div className="pt-2 text-center">
        <a
          href="/blogs"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          查看更多 →
        </a>
      </div>
    </section>
  );
}
