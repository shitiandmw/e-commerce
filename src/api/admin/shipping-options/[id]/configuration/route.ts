import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getShippingOptionPickupLocation } from "../../../../../lib/shipping-availability"
import { updateShippingOptionConfigurationWorkflow } from "../../../../../workflows/shipping-option/update-shipping-option-configuration"
import type { PostAdminShippingOptionConfigurationType } from "./validators"

export const POST = async (
  req: MedusaRequest<PostAdminShippingOptionConfigurationType>,
  res: MedusaResponse
) => {
  const { result } = await updateShippingOptionConfigurationWorkflow(
    req.scope
  ).run({
    input: {
      id: req.params.id,
      shipping_option: req.validatedBody.shipping_option,
      pickup_location_id: req.validatedBody.pickup_location_id,
    },
  })
  const binding = await getShippingOptionPickupLocation(
    req.scope,
    req.params.id
  )

  res.json({
    shipping_option: result[0],
    ...binding,
  })
}
