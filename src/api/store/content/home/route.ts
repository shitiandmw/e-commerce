import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const now = new Date().toISOString()

  // Fetch active banners (enabled + within time window)
  const { data: bannerSlots } = await query.graph({
    entity: "banner_slot",
    fields: [
      "id", "name", "key", "description",
      "items.id", "items.image_url", "items.title", "items.subtitle",
      "items.link_url", "items.sort_order", "items.is_enabled",
      "items.starts_at", "items.ends_at",
    ],
  })

  // Filter banner items: enabled + time window
  const banners = (bannerSlots || []).map((slot: any) => ({
    ...slot,
    items: (slot.items || [])
      .filter((item: any) => {
        if (!item.is_enabled) return false
        if (item.starts_at && new Date(item.starts_at) > new Date(now)) return false
        if (item.ends_at && new Date(item.ends_at) < new Date(now)) return false
        return true
      })
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
  }))

  // Fetch active announcements
  const { data: allAnnouncements } = await query.graph({
    entity: "announcement",
    fields: [
      "id", "text", "link_url", "sort_order",
      "is_enabled", "starts_at", "ends_at",
    ],
  })

  const announcements = (allAnnouncements || [])
    .filter((a: any) => {
      if (!a.is_enabled) return false
      if (a.starts_at && new Date(a.starts_at) > new Date(now)) return false
      if (a.ends_at && new Date(a.ends_at) < new Date(now)) return false
      return true
    })
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

  // Fetch active popups
  const { data: allPopups } = await query.graph({
    entity: "popup",
    fields: [
      "id", "title", "description", "image_url",
      "button_text", "button_link", "is_enabled",
      "trigger_type", "display_frequency", "target_page", "sort_order",
    ],
  })

  // PLACEHOLDER_POPUPS_AND_COLLECTIONS
  const popups = (allPopups || [])
    .filter((p: any) => p.is_enabled)
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

  // Fetch curated collections with tabs and items
  const { data: allCollections } = await query.graph({
    entity: "curated_collection",
    fields: [
      "id", "name", "key", "description", "sort_order",
      "tabs.id", "tabs.name", "tabs.key", "tabs.sort_order",
      "items.id", "items.product_id", "items.tab_id", "items.sort_order",
    ],
  })

  // Collect all product_ids from collection items
  const productIds = new Set<string>()
  for (const c of allCollections || []) {
    for (const item of c.items || []) {
      if (item.product_id) productIds.add(item.product_id)
    }
  }

  // Batch fetch product details via product module service (bypasses store scoping)
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
      console.error("[home] Failed to fetch products:", e?.message)
    }
  }

  const collections = (allCollections || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((c: any) => ({
      ...c,
      tabs: (c.tabs || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
      items: (c.items || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((item: any) => ({
          ...item,
          product: productMap.get(item.product_id) || null,
        })),
    }))

  res.json({
    banners,
    announcements,
    popups,
    collections,
  })
}
