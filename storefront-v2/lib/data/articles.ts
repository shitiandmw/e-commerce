import { fetchContent } from "@/lib/medusa"

export interface ArticleCategory {
  id: string
  name: string
  handle: string
  description?: string | null
}

export interface Article {
  id: string
  title: string
  slug: string
  cover_image?: string | null
  summary?: string | null
  content?: string | null
  status: string
  published_at?: string | null
  sort_order?: number
  is_pinned?: boolean
  category_id?: string | null
  category?: ArticleCategory | null
  seo?: {
    meta_title?: string
    meta_description?: string
    og_image?: string
    keywords?: string
  } | null
  created_at: string
  updated_at: string
}

export interface ArticlesResponse {
  articles: Article[]
  count: number
  offset: number
  limit: number
}

export interface ArticleResponse {
  article: Article
}

export async function fetchArticles(params?: {
  category?: string
  q?: string
  offset?: number
  limit?: number
}): Promise<ArticlesResponse> {
  const queryParams: Record<string, string> = {}
  if (params?.category) queryParams.category = params.category
  if (params?.q) queryParams.q = params.q
  if (params?.offset !== undefined) queryParams.offset = String(params.offset)
  if (params?.limit !== undefined) queryParams.limit = String(params.limit)

  const result = await fetchContent<ArticlesResponse>(
    "/store/content/articles",
    queryParams
  )
  return result ?? { articles: [], count: 0, offset: 0, limit: 20 }
}

export async function fetchArticle(slug: string): Promise<Article | null> {
  const result = await fetchContent<ArticleResponse>(
    `/store/content/articles/${slug}`
  )
  return result?.article ?? null
}
