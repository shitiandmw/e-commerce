import { ArticleListContent } from "@/components/articles/article-list-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "茄時分享 | TimeCigar 雪茄時間",
  description: "探索雪茄世界的最新資訊、品鑑指南、品味生活文章和 Podcast",
}

export default function ArticlesPage() {
  return <ArticleListContent />
}
