import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export interface ArticleItem {
  id: string
  title: string
  slug: string
  cover_image?: string | null
  summary?: string | null
  published_at?: string | null
  category?: { id: string; name: string } | null
}

interface BlogPreviewProps {
  articles?: ArticleItem[]
}

export async function BlogPreview({ articles = [] }: BlogPreviewProps) {
  const t = await getTranslations()
  if (articles.length === 0) return null

  return (
    <section className="py-16 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Time for Shares</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{t("blog_section_title")}</h2>
          </div>
          <Link
            href="/articles"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            {t("view_all")} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {article.cover_image ? (
                  <Image
                    src={article.cover_image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                {article.category?.name && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-gold/90 text-primary-foreground text-[10px] font-medium px-2 py-1 tracking-wider">
                      {article.category.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                {article.published_at && (
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(article.published_at).toLocaleDateString("zh-TW")}
                  </p>
                )}
                <h3 className="mt-1.5 text-base font-serif font-medium text-foreground leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            {t("blog_view_all_articles")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
