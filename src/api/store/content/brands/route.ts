import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const q = req.query.q as string | undefined
  const locale = req.query.locale as string | undefined
  const offset = parseInt((req.query.offset as string) || "0", 10)
  const limit = parseInt((req.query.limit as string) || "20", 10)

  const filters: Record<string, any> = {}
  if (q) {
    filters.name = { $like: `%${q}%` }
  }

  const { data: brands, metadata } = await query.graph(
    {
      entity: "brand",
      fields: ["id", "name", "description", "logo_url", "created_at", "updated_at"],
      filters,
      pagination: {
        skip: offset,
        take: limit,
        order: {
          name: "ASC",
        },
      },
    },
    { locale },
  )

  res.json({
    brands: brands || [],
    count: metadata?.count || 0,
    offset,
    limit,
  })
}
