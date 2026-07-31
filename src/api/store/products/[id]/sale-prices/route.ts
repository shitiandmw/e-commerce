import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStoreProductSalePrices } from "../../../../../lib/product-sale-pricing"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const now = new Date()
  const salePrices = await getStoreProductSalePrices(
    req.scope,
    req.params.id,
    now
  )

  res.status(200).json({
    sale_prices: salePrices,
    server_time: now.toISOString(),
  })
}
