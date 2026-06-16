import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStoreContentLocale } from "../request-locale"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { handle } = req.params
  const locale = getStoreContentLocale(req as any)

  const { data: brands } = await query.graph(
    {
      entity: "brand",
      fields: [
        "id", "name", "description", "logo_url",
        "products.*",
        "created_at", "updated_at",
      ],
      filters: {
        id: handle,
      },
    },
    { locale },
  )

  if (!brands || brands.length === 0) {
    res.status(404).json({ message: "Brand not found" })
    return
  }

  const brand = brands[0] as Record<string, any>
  if (Array.isArray(brand.products)) {
    brand.products = brand.products.filter(Boolean)
  }

  res.json({ brand })
}
