import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { prepareCartShippingSnapshot } from "../../../../../../lib/shipping-availability"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const snapshot = await prepareCartShippingSnapshot(req.scope, req.params.id)
  res.json({ shipping_delivery_snapshot: snapshot })
}
