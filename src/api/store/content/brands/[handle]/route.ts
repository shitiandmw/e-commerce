import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { handle } = req.params
  const locale = req.query.locale as string | undefined

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

  res.json({ brand: brands[0] })
}
