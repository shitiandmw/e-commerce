import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getProductShippingOptions,
  syncProductShippingOptions,
} from "../../../../../lib/shipping-availability"
import type { PostAdminProductShippingOptionsType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const result = await getProductShippingOptions(req.scope, req.params.id)
  res.json(result)
}

export const POST = async (
  req: MedusaRequest<PostAdminProductShippingOptionsType>,
  res: MedusaResponse
) => {
  await syncProductShippingOptions(
    req.scope,
    req.params.id,
    req.validatedBody.shipping_option_ids
  )
  const result = await getProductShippingOptions(req.scope, req.params.id)
  res.json(result)
}
