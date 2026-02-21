import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)
  const limit = parseInt(url.searchParams.get("limit") || "20", 10)

  // Find the "page" category
  const { data: categories } = await query.graph({
    entity: "article_category",
    fields: ["id"],
    filters: { handle: "page" },
  })

  const categoryId = categories[0]?.id
  if (!categoryId) {
    res.json({ pages: [], count: 0, offset, limit })
    return
  }

  const { data: articles, metadata } = await query.graph(
    {
      entity: "article",
      fields: [
        "id", "title", "slug", "cover_image", "summary", "content",
        "status", "published_at", "sort_order", "is_pinned",
        "category_id", "category.*", "seo",
        "created_at", "updated_at",
      ],
      filters: { status: "published", category_id: categoryId },
      pagination: { skip: offset, take: limit, order: { sort_order: "ASC" } },
    },
    { locale },
  )

  // Map to page-compatible response
  const pages = articles.map((a: any) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    content: a.content,
    status: a.status,
    sort_order: a.sort_order,
    seo: a.seo,
    created_at: a.created_at,
    updated_at: a.updated_at,
  }))

  res.json({
    pages,
    count: metadata?.count || pages.length,
    offset,
    limit,
  })
}
