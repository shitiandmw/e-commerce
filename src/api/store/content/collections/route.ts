import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

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

  // Collect all product_ids
  const productIds = new Set<string>()
  for (const c of collections || []) {
    for (const item of (c as any).items || []) {
      if (item.product_id) productIds.add(item.product_id)
    }
  }

  // Batch fetch product details via product module service
  const productMap = new Map<string, any>()
  if (productIds.size > 0) {
    try {
      const productService = req.scope.resolve(Modules.PRODUCT)
      const prods = await productService.listProducts(
        { id: Array.from(productIds) },
        { select: ["id", "title", "handle", "thumbnail"] }
      )
      for (const p of prods || []) {
        productMap.set(p.id, { id: p.id, title: p.title, handle: p.handle, thumbnail: p.thumbnail })
      }
    } catch (e: any) {
      console.error("Failed to fetch products for collections:", e?.message)
    }
  }

  const result = (collections || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((c: any) => ({
      ...c,
      tabs: (c.tabs || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      ),
      items: (c.items || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((item: any) => ({
          ...item,
          product: productMap.get(item.product_id) || null,
        })),
    }))

  res.json({ collections: result })
}
