import { ArticleListContent } from "@/components/articles/article-list-content"
import { fetchArticles } from "@/lib/data/articles"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: t('seo_articles_title'),
    description: t('seo_articles_description'),
  }
}

export default async function ArticlesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { category } = await searchParams
  const { articles } = await fetchArticles({ limit: 50, locale })

  // 从文章数据中提取所有分类
  const categoryMap = new Map<string, { id: string; name: string }>()
  for (const article of articles) {
    if (article.category) {
      categoryMap.set(article.category.id, {
        id: article.category.id,
        name: article.category.name,
      })
    }
  }
  const categories = Array.from(categoryMap.values())

  return (
    <ArticleListContent
      articles={articles}
      categories={categories}
      activeCategory={category}
    />
  )
}
