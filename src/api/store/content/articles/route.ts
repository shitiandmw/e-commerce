import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const category = req.query.category as string | undefined
  const q = req.query.q as string | undefined
  const offset = parseInt((req.query.offset as string) || "0", 10)
  const limit = parseInt((req.query.limit as string) || "20", 10)

  const filters: Record<string, any> = {
    status: "published",
  }

  if (category) {
    filters.category_id = category
  }

  if (q) {
    filters.title = { $like: `%${q}%` }
  }

  const { data: articles, metadata } = await query.graph({
    entity: "article",
    fields: [
      "id", "title", "slug", "cover_image", "summary",
      "status", "published_at", "sort_order", "is_pinned",
      "category_id", "category.id", "category.name", "category.handle",
      "created_at", "updated_at",
    ],
    filters,
    pagination: {
      skip: offset,
      take: limit,
      order: {
        is_pinned: "DESC",
        sort_order: "ASC",
        published_at: "DESC",
      },
    },
  })

  res.json({
    articles: articles || [],
    count: metadata?.count || 0,
    offset,
    limit,
  })
}
