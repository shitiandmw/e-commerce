import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

  const { data: articles, metadata } = await query.graph(
    {
      entity: "article",
      fields: [
        "id", "title", "slug", "cover_image", "summary",
        "status", "published_at", "sort_order", "is_pinned",
        "category_id", "category.*", "seo",
        "created_at", "updated_at",
      ],
      filters,
      pagination: { skip: offset, take: limit, order: { sort_order: "ASC", created_at: "DESC" } },
    },
    { locale },
  )

  res.json({
    articles,
    count: metadata?.count || articles.length,
    offset,
    limit,
  })
}
