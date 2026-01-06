export interface Product {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  link?: string;
  githubUrl?: string;
}

export interface ProductsSectionProps {
  products: Product[];
}

export default function ProductsSection({ products }: ProductsSectionProps) {
  return (
    <section className="space-y-6 px-10 py-16">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">我的作品</h2>
        <p className="text-muted-foreground">我做的一些项目</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.link || `/products/${product.id}`}
            target={product.link ? "_blank" : undefined}
            rel={product.link ? "noopener noreferrer" : undefined}
            className="group block overflow-hidden rounded-lg border border-border"
          >
            {/* 封面图片 */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {product.coverImage ? (
                <img
                  src={product.coverImage}
                  alt={product.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <span className="text-sm">暂无封面</span>
                </div>
              )}
              {product.githubUrl && (
                <span className="absolute right-2 bottom-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  开源
                </span>
              )}
            </div>

            {/* 内容区域 */}
            <div className="space-y-2 p-4">
              <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                {product.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div className="pt-2 text-center">
        <a
          href="/products"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          查看更多 →
        </a>
      </div>
    </section>
  );
}
