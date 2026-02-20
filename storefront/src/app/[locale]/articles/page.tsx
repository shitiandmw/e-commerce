import Link from "next/link"
import { fetchContent } from "@/lib/api"
import { getDictionary, type Locale } from "@/lib/i18n"

interface Article {
  id: string
  title: string
  slug: string
  cover_image: string | null
  summary: string | null
  published_at: string | null
  category?: { id: string; name: string; handle: string } | null
}

interface ArticlesResponse {
  articles: Article[]
  count: number
  offset: number
  limit: number
}

interface CategoryItem {
  id: string
  name: string
  handle: string
}

const PAGE_SIZE = 12

export default async function ArticlesPage({
  params: paramsPromise,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { locale } = await paramsPromise
  const dict = await getDictionary(locale as Locale)
  const params = await searchParams
  const currentPage = parseInt(params.page || "1", 10)
  const offset = (currentPage - 1) * PAGE_SIZE

  let data: ArticlesResponse
  try {
    data = await fetchContent<ArticlesResponse>("/store/content/articles", {
      offset,
      limit: PAGE_SIZE,
      locale,
      ...(params.category ? { category: params.category } : {}),
    })
  } catch {
    data = { articles: [], count: 0, offset: 0, limit: PAGE_SIZE }
  }

  // Fetch all articles to extract unique categories for filter
  let allCategories: CategoryItem[] = []
  try {
    const allData = await fetchContent<ArticlesResponse>("/store/content/articles", { limit: 100, locale })
    const catMap = new Map<string, CategoryItem>()
    allData.articles.forEach((a) => {
      if (a.category) catMap.set(a.category.id, a.category)
    })
    allCategories = Array.from(catMap.values())
  } catch {
    // ignore
  }

  const totalPages = Math.ceil(data.count / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gold">{dict.articles_title || "资讯文章"}</h1>

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/articles`}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              !params.category
                ? "bg-gold text-background"
                : "border border-border text-muted hover:text-gold"
            }`}
          >
            {dict.all_categories || "全部"}
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${locale}/articles?category=${cat.id}`}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                params.category === cat.id
                  ? "bg-gold text-background"
                  : "border border-border text-muted hover:text-gold"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Article cards */}
      {data.articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mb-2 text-lg text-muted">{dict.no_articles || "暂无文章"}</p>
          <p className="text-sm text-muted">{dict.no_articles_desc || "请稍后再来查看最新资讯"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.articles.map((article) => (
            <Link
              key={article.id}
              href={`/${locale}/articles/${article.slug}`}
              className="group overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/30"
            >
              {article.cover_image ? (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-surface-light">
                  <span className="text-3xl text-muted/30">📄</span>
                </div>
              )}
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  {article.category && (
                    <span className="rounded bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      {article.category.name}
                    </span>
                  )}
                  {article.published_at && (
                    <span className="text-xs text-muted">
                      {new Date(article.published_at).toLocaleDateString(locale)}
                    </span>
                  )}
                </div>
                <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="line-clamp-2 text-sm text-muted">{article.summary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/articles?page=${currentPage - 1}${params.category ? `&category=${params.category}` : ""}`}
              className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-gold"
            >
              {dict.prev_page || "上一页"}
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/${locale}/articles?page=${page}${params.category ? `&category=${params.category}` : ""}`}
              className={`rounded px-4 py-2 text-sm ${
                page === currentPage
                  ? "bg-gold text-background"
                  : "border border-border text-muted hover:text-gold"
              }`}
            >
              {page}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/articles?page=${currentPage + 1}${params.category ? `&category=${params.category}` : ""}`}
              className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-gold"
            >
              {dict.next_page || "下一页"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
