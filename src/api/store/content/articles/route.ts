import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function applyLocale(entity: any, locale?: string) {
  if (!locale || !entity) return entity

  const translations = entity.translations
  if (!translations) return entity

  // Try requested locale first, then zh-CN fallback, then original
  const localeData = translations[locale] || translations["zh-CN"]
  if (!localeData) return entity

  const result = { ...entity }
  if (localeData.title) result.title = localeData.title
  if (localeData.summary) result.summary = localeData.summary
  if (localeData.content) result.content = localeData.content
  return result
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined
  const category = url.searchParams.get("category") || undefined
  const q = url.searchParams.get("q") || undefined
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)
  const limit = parseInt(url.searchParams.get("limit") || "20", 10)

  const filters: Record<string, any> = { status: "published" }
  if (category) filters.category_id = category
  if (q) filters.title = { $like: `%${q}%` }

  const { data: articles, metadata } = await query.graph({
    entity: "article",
    fields: [
      "id", "title", "slug", "cover_image", "summary",
      "status", "published_at", "sort_order", "is_pinned",
      "category_id", "category.*", "translations", "seo",
      "created_at", "updated_at",
    ],
    filters,
    pagination: { skip: offset, take: limit, order: { sort_order: "ASC", created_at: "DESC" } },
  })

  const plainArticles = JSON.parse(JSON.stringify(articles))
  const localizedArticles = plainArticles.map((a: any) => applyLocale(a, locale))

  res.json({
    articles: localizedArticles,
    count: metadata?.count || articles.length,
    offset,
    limit,
  })
}
