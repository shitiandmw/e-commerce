import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { slug } = req.params
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined

  // Find the "page" category
  const { data: categories } = await query.graph({
    entity: "article_category",
    fields: ["id"],
    filters: { handle: "page" },
  })

  const categoryId = categories[0]?.id
  if (!categoryId) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  const { data: [article] } = await query.graph(
    {
      entity: "article",
      fields: [
        "id", "title", "slug", "cover_image", "summary", "content",
        "status", "published_at", "sort_order", "is_pinned",
        "category_id", "category.*", "seo",
        "created_at", "updated_at",
      ],
      filters: { slug, status: "published", category_id: categoryId },
    },
    { locale },
  )

  if (!article) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  // Auto-generate SEO defaults if not set
  const seo = (article as any).seo || {}
  if (!seo.meta_title && !seo.meta_description) {
    ;(article as any).seo = {
      meta_title: seo.meta_title || (article as any).title?.slice(0, 60),
      meta_description: seo.meta_description || ((article as any).content || "").replace(/<[^>]*>/g, " ").slice(0, 160),
      og_image: seo.og_image || "",
      keywords: seo.keywords || "",
    }
  }

  // Return as page-compatible response
  const page = {
    id: article.id,
    title: (article as any).title,
    slug: (article as any).slug,
    content: (article as any).content,
    status: (article as any).status,
    sort_order: (article as any).sort_order,
    seo: (article as any).seo,
    created_at: (article as any).created_at,
    updated_at: (article as any).updated_at,
  }

  res.json({ page })
}
