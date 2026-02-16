import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { slug } = req.params

  const { data: pages } = await query.graph({
    entity: "page",
    fields: [
      "id", "title", "slug", "content", "status",
      "template", "sort_order", "created_at", "updated_at",
    ],
    filters: {
      slug,
      status: "published",
    },
  })

  if (!pages || pages.length === 0) {
    res.status(404).json({ message: "Page not found" })
    return
  }

  res.json({ page: pages[0] })
}
