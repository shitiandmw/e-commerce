import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { slug } = req.params

  const { data: articles } = await query.graph({
    entity: "article",
    fields: [
      "id", "title", "slug", "cover_image", "summary", "content",
      "status", "published_at", "sort_order", "is_pinned",
      "category_id", "category.id", "category.name", "category.handle",
      "created_at", "updated_at",
    ],
    filters: {
      slug,
      status: "published",
    },
  })

  if (!articles || articles.length === 0) {
    res.status(404).json({ message: "Article not found" })
    return
  }

  res.json({ article: articles[0] })
}
