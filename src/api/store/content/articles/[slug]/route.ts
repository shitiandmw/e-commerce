import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { slug } = req.params
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined

  const { data: [article] } = await query.graph(
    {
      entity: "article",
      fields: [
        "id", "title", "slug", "cover_image", "summary", "content",
        "status", "published_at", "sort_order", "is_pinned",
        "category_id", "category.*", "seo",
        "created_at", "updated_at",
      ],
      filters: { slug, status: "published" },
    },
    { locale },
  )

  if (!article) {
    res.status(404).json({ message: "Article not found" })
    return
  }

  // Auto-generate SEO defaults if not set
  if (!article.seo || (!(article as any).seo.meta_title && !(article as any).seo.meta_description)) {
    (article as any).seo = {
      meta_title: (article as any).seo?.meta_title || article.title?.slice(0, 60),
      meta_description: (article as any).seo?.meta_description || ((article as any).summary || "").slice(0, 160),
      og_image: (article as any).seo?.og_image || (article as any).cover_image || "",
      keywords: (article as any).seo?.keywords || "",
    }
  }

  res.json({ article })
}
