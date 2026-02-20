import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const now = new Date().toISOString()
  const position = (req.query.position as string) || ""
  const locale = req.query.locale as string | undefined

  const { data: bannerSlots } = await query.graph(
    {
      entity: "banner_slot",
      fields: [
        "id", "name", "key", "description",
        "items.id", "items.image_url", "items.title", "items.subtitle",
        "items.link_url", "items.cta_text", "items.sort_order", "items.is_enabled",
        "items.starts_at", "items.ends_at",
      ],
      filters: position ? { key: position } : undefined,
    },
    { locale },
  )

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

  res.json({ banners })
}
