import { ArticleListContent } from "@/components/articles/article-list-content"
import { fetchArticles } from "@/lib/data/articles"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "茄時分享 | TimeCigar 雪茄時間",
  description: "探索雪茄世界的最新資訊、品鑑指南、品味生活文章和 Podcast",
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const { articles } = await fetchArticles({ limit: 50 })

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
