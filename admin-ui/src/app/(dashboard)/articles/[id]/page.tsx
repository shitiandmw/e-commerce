"use client"

import { useParams } from "next/navigation"
import { ArticleDetail } from "@/components/articles/article-detail"

export default function ArticleDetailPage() {
  const params = useParams()
  const articleId = params.id as string

  return <ArticleDetail articleId={articleId} />
}
