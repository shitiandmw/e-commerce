import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchContent } from "@/lib/api"

interface Article {
  id: string
  title: string
  slug: string
  cover_image: string | null
  summary: string | null
  content: string | null
  published_at: string | null
  category?: { id: string; name: string; handle: string } | null
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let article: Article
  try {
    const data = await fetchContent<{ article: Article }>(
      `/store/content/articles/${slug}`
    )
    article = data.article
  } catch {
    notFound()
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/articles"
          className="text-sm text-muted hover:text-gold transition-colors"
        >
          ← 返回文章列表
        </Link>
      </div>

      <header className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          {article.category && (
            <Link
              href={`/articles?category=${article.category.id}`}
              className="rounded bg-gold/10 px-2 py-0.5 text-xs text-gold hover:bg-gold/20"
            >
              {article.category.name}
            </Link>
          )}
          {article.published_at && (
            <span className="text-sm text-muted">
              {new Date(article.published_at).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
        {article.summary && (
          <p className="mt-4 text-lg text-muted">{article.summary}</p>
        )}
      </header>

      {article.cover_image && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {article.content && (
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}
    </article>
  )
}
