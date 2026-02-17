import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchContent } from "@/lib/api"

interface SeoData {
  meta_title?: string
  meta_description?: string
  og_image?: string
  keywords?: string
}

interface Article {
  id: string
  title: string
  slug: string
  cover_image: string | null
  summary: string | null
  content: string | null
  published_at: string | null
  seo?: SeoData | null
  category?: { id: string; name: string; handle: string } | null
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const data = await fetchContent<{ article: Article }>(
      `/store/content/articles/${slug}`
    )
    return data.article
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: "文章未找到" }

  const seo = article.seo
  // If seo.meta_title differs from article.title, it's user-customized
  const isCustomTitle = !!seo?.meta_title && seo.meta_title !== article.title
  const displayTitle = isCustomTitle ? seo!.meta_title! : (article.title || "")
  const description =
    seo?.meta_description || article.summary || `${article.title} - TIMECIGAR 资讯`
  const ogImage = seo?.og_image || article.cover_image || undefined

  return {
    title: isCustomTitle ? { absolute: displayTitle } : displayTitle,
    description,
    keywords: seo?.keywords || undefined,
    openGraph: {
      title: isCustomTitle ? displayTitle : `${displayTitle} - TIMECIGAR`,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link
          href={`/${locale}/articles`}
          className="text-sm text-muted hover:text-gold transition-colors"
        >
          ← 返回文章列表
        </Link>
      </div>

      <header className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          {article.category && (
            <Link
              href={`/${locale}/articles?category=${article.category.id}`}
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
