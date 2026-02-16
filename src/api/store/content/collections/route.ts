import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const key = req.query.key as string | undefined

  const filters: Record<string, any> = {}
  if (key) {
    filters.key = key
  }

  const { data: collections } = await query.graph({
    entity: "curated_collection",
    fields: [
      "id", "name", "key", "description", "sort_order",
      "tabs.id", "tabs.name", "tabs.key", "tabs.sort_order",
      "items.id", "items.product_id", "items.tab_id", "items.sort_order",
    ],
    filters,
  })

  const result = (collections || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((c: any) => ({
      ...c,
      tabs: (c.tabs || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      ),
      items: (c.items || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      ),
    }))

  res.json({ collections: result })
}
