// EDIT HERE: Section title and description
const SECTION_DATA = {
  title: "我的作品",
  description: "最新的 3 个项目",
} as const;

export interface RecentPostsSectionProps {
  posts: Array<{
    id: string;
    title: string;
    description: string;
    coverImage?: string;
  }>;
}

export default function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  return (
    <section className="space-y-6 px-10 py-16">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{SECTION_DATA.title}</h2>
        <p className="text-muted-foreground">{SECTION_DATA.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <a
            key={index}
            href={`/blog/${post.id}`}
            className="group block overflow-hidden rounded-lg border border-border"
          >
            {/* 封面图片 */}
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
    </section>
  );
}
