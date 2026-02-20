import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const url = new URL(req.url || "", `http://${req.headers.host}`)
  const locale = url.searchParams.get("locale") || undefined
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)
  const limit = parseInt(url.searchParams.get("limit") || "20", 10)

  const { data: pages, metadata } = await query.graph(
    {
      entity: "page",
      fields: [
        "id", "title", "slug", "content", "status", "template",
        "sort_order", "seo", "created_at", "updated_at",
      ],
      filters: { status: "published" },
      pagination: { skip: offset, take: limit, order: { sort_order: "ASC" } },
    },
    { locale },
  )

  res.json({
    pages,
    count: metadata?.count || pages.length,
    offset,
    limit,
  })
}
