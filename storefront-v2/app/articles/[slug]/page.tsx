import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ShareButtons } from "@/components/articles/share-buttons"
import { fetchArticle, fetchArticles } from "@/lib/data/articles"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await fetchArticle(slug)
  if (!article) return { title: "找不到文章 | TimeCigar" }
  return {
    title: article.seo?.meta_title || `${article.title} | TimeCigar 雪茄時間`,
    description: article.seo?.meta_description || article.summary || "",
    openGraph: article.seo?.og_image ? { images: [article.seo.og_image] } : undefined,
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await fetchArticle(slug)
  if (!article) notFound()

  // 获取相关文章（同分类，排除当前文章）
  const { articles: allArticles } = await fetchArticles({ limit: 50 })
  const relatedArticles = allArticles
    .filter((a) => a.slug !== slug && a.category_id === article.category_id)
    .slice(0, 3)

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("zh-TW")
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-4xl px-4 py-4 lg:px-6" aria-label="麵包屑導航">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-gold transition-colors">首頁</Link></li>
          <li><ChevronRight className="size-3" /></li>
          <li><Link href="/articles" className="hover:text-gold transition-colors">茄時分享</Link></li>
          <li><ChevronRight className="size-3" /></li>
          <li className="text-foreground/60 line-clamp-1">{article.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
      <article className="mx-auto max-w-4xl px-4 pb-16 lg:px-6">
        <header className="mb-8">
          {article.category?.name && (
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-gold/10 text-gold text-xs font-medium px-3 py-1 border border-gold/20">
                {article.category.name}
              </span>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground leading-tight text-balance">
            {article.title}
          </h1>
          {article.published_at && (
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatDate(article.published_at)}</span>
            </div>
          )}
        </header>

        {/* Cover Image */}
        {article.cover_image && (
          <div className="relative aspect-[21/9] overflow-hidden mb-10">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose-custom">
          {article.summary && (
            <p className="text-base text-foreground/80 leading-relaxed mb-6 font-medium">
              {article.summary}
            </p>
          )}
          {article.content && (
            <div
              className="article-content text-sm text-muted-foreground leading-relaxed [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:my-4 [&_ul]:my-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ol]:my-4 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2 [&_li]:leading-relaxed [&_img]:my-6 [&_img]:max-w-full [&_a]:text-gold [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}
        </div>

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground mb-3">分享此文章</p>
          <ShareButtons title={article.title} />
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-serif font-bold text-foreground mb-8">相關文章</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {related.cover_image ? (
                      <Image
                        src={related.cover_image}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-muted-foreground">{formatDate(related.published_at)}</p>
                    <h3 className="mt-1 text-sm font-serif font-medium text-foreground group-hover:text-gold transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
