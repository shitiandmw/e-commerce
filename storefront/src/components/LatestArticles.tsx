import Link from "next/link"

interface Article {
  id: string
  title: string
  slug: string
  cover_image?: string
  summary?: string
  published_at?: string
  category?: { id: string; name: string; handle: string }
}

export default function LatestArticles({ articles }: { articles: Article[] }) {
  if (!articles || articles.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="mb-8 flex items-center justify-between md:mb-10">
        <div>
          <h2 className="text-xl font-bold text-gold md:text-2xl">最新资讯</h2>
          <p className="mt-1 text-sm text-muted">了解雪茄文化与行业动态</p>
        </div>
        <Link
          href="/articles"
          className="text-sm text-gold transition hover:text-gold-light"
        >
          查看更多 →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group overflow-hidden rounded-lg bg-surface transition hover:ring-1 hover:ring-gold/30"
          >
            <div className="aspect-[16/10] overflow-hidden bg-surface-light">
              {article.cover_image ? (
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4">
              {article.category && (
                <span className="mb-2 inline-block rounded bg-gold/10 px-2 py-0.5 text-xs text-gold">
                  {article.category.name}
                </span>
              )}
              <h3 className="mb-2 line-clamp-2 text-sm font-medium text-foreground group-hover:text-gold">
                {article.title}
              </h3>
              {article.summary && (
                <p className="line-clamp-2 text-xs text-muted">{article.summary}</p>
              )}
              {article.published_at && (
                <p className="mt-3 text-xs text-muted">
                  {new Date(article.published_at).toLocaleDateString("zh-CN")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
