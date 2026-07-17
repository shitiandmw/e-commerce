import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCartShippingAvailability } from "../../../../../lib/shipping-availability"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const availability = await getCartShippingAvailability(req.scope, req.params.id)
  const { cart: _cart, ...result } = availability
  res.json(result)
}
