import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const { data: pickupLocations } = await query.graph({
    entity: "pickup_location",
    fields: [
      "id",
      "name",
      "address",
      "phone",
      "hours",
      "note",
      "sort_order",
      "is_enabled",
    ],
    filters: { is_enabled: true },
    pagination: { order: { sort_order: "ASC", created_at: "ASC", id: "ASC" } },
  })

  res.json({ pickup_locations: pickupLocations || [] })
}
