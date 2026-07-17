import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getShippingOptionPickupLocation } from "../../../../../lib/shipping-availability"
import { syncShippingOptionPickupLocationWorkflow } from "../../../../../workflows/shipping-option/update-shipping-option-configuration"
import type { PostAdminShippingOptionPickupLocationType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const result = await getShippingOptionPickupLocation(req.scope, req.params.id)
  res.json(result)
}

export const POST = async (
  req: MedusaRequest<PostAdminShippingOptionPickupLocationType>,
  res: MedusaResponse
) => {
  const { result } = await syncShippingOptionPickupLocationWorkflow(
    req.scope
  ).run({
    input: {
      id: req.params.id,
      pickup_location_id: req.validatedBody.pickup_location_id,
    },
  })
  res.json(result)
}
