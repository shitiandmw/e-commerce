import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { slug } = req.params
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined

  const { data: [page] } = await query.graph(
    {
      entity: "page",
      fields: [
        "id", "title", "slug", "content", "status", "template",
        "sort_order", "seo", "created_at", "updated_at",
      ],
      filters: { slug, status: "published" },
    },
    { locale },
  )

  if (!page) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  // Auto-generate SEO defaults if not set
  if (!page.seo || (!(page as any).seo.meta_title && !(page as any).seo.meta_description)) {
    (page as any).seo = {
      meta_title: (page as any).seo?.meta_title || page.title?.slice(0, 60),
      meta_description: (page as any).seo?.meta_description || ((page as any).content || "").replace(/<[^>]*>/g, " ").slice(0, 160),
      og_image: (page as any).seo?.og_image || "",
      keywords: (page as any).seo?.keywords || "",
    }
  }

  res.json({ page })
}
