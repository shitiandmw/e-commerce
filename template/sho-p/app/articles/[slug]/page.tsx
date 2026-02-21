import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ArrowLeft, ArrowRight, Clock, User } from "lucide-react"
import { getArticleBySlug, articles } from "@/lib/data/articles"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: "找不到文章 | TimeCigar" }
  return {
    title: `${article.title} | TimeCigar 雪茄時間`,
    description: article.excerpt,
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const currentIndex = articles.findIndex(a => a.slug === slug)
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null
  const relatedArticles = articles
    .filter(a => a.slug !== slug && a.category === article.category)
    .slice(0, 3)

  // Parse markdown-like content into simple HTML
  const contentSections = article.content.split("\n\n").map((block, i) => {
    if (block.startsWith("## ")) {
      return <h2 key={i} className="text-xl font-serif font-bold text-foreground mt-8 mb-4">{block.replace("## ", "")}</h2>
    }
    if (block.startsWith("### ")) {
      return <h3 key={i} className="text-lg font-serif font-semibold text-foreground mt-6 mb-3">{block.replace("### ", "")}</h3>
    }
    if (block.startsWith("- ")) {
      const items = block.split("\n").map(line => line.replace("- ", ""))
      return (
        <ul key={i} className="my-4 flex flex-col gap-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-1.5 size-1.5 rounded-full bg-gold shrink-0" />
              {item.replace(/\*\*(.*?)\*\*/g, "$1")}
            </li>
          ))}
        </ul>
      )
    }
    if (block.match(/^\d+\./)) {
      const items = block.split("\n").map(line => line.replace(/^\d+\.\s*/, ""))
      return (
        <ol key={i} className="my-4 flex flex-col gap-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center bg-gold/10 text-gold text-[10px] font-medium">
                {j + 1}
              </span>
              {item.replace(/\*\*(.*?)\*\*/g, "$1")}
            </li>
          ))}
        </ol>
      )
    }
    return <p key={i} className="text-sm text-muted-foreground leading-relaxed my-4">{block}</p>
  })

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
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-gold/10 text-gold text-xs font-medium px-3 py-1 border border-gold/20">
              {article.category}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground leading-tight text-balance">
            {article.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {article.author}
            </span>
            <span className="text-border">|</span>
            <span>{article.date}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {article.readTime}
            </span>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative aspect-[21/9] overflow-hidden mb-10">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Content */}
        <div className="prose-custom">
          <p className="text-base text-foreground/80 leading-relaxed mb-6 font-medium">
            {article.excerpt}
          </p>
          {contentSections}
        </div>

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground mb-3">分享此文章</p>
          <div className="flex items-center gap-3">
            {["Facebook", "Twitter", "WhatsApp"].map((platform) => (
              <button
                key={platform}
                className="px-4 py-2 text-xs border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/50 transition-colors"
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Prev/Next Navigation */}
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          {prevArticle ? (
            <Link
              href={`/articles/${prevArticle.slug}`}
              className="group flex items-center gap-4 p-4 border border-border/30 hover:border-gold/30 transition-colors"
            >
              <ArrowLeft className="size-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">上一篇</p>
                <p className="text-sm font-medium text-foreground group-hover:text-gold transition-colors line-clamp-1 mt-1">
                  {prevArticle.title}
                </p>
              </div>
            </Link>
          ) : <div />}
          {nextArticle ? (
            <Link
              href={`/articles/${nextArticle.slug}`}
              className="group flex items-center justify-end gap-4 p-4 border border-border/30 hover:border-gold/30 transition-colors text-right"
            >
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">下一篇</p>
                <p className="text-sm font-medium text-foreground group-hover:text-gold transition-colors line-clamp-1 mt-1">
                  {nextArticle.title}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
            </Link>
          ) : <div />}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-serif font-bold text-foreground mb-8">相關文章</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  href={`/articles/${related.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={related.image}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] text-muted-foreground">{related.date}</p>
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
