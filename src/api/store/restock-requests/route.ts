import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import {
  createRestockRequest,
  getRestockRequestStatus,
  getRestockSalesChannelId,
} from "./helpers"
import { StoreAnonymousRestockRequestBodyType } from "./validators"

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const variantId = req.query.variant_id as string
  const visitorId = req.query.visitor_id as string
  const result = await getRestockRequestStatus(req.scope, {
    variant_id: variantId,
    visitor_id: visitorId,
    sales_channel_id: getRestockSalesChannelId(req),
  })
  res.json(result)
}

export async function POST(
  req: MedusaStoreRequest<StoreAnonymousRestockRequestBodyType>,
  res: MedusaResponse
) {
  const result = await createRestockRequest(req.scope, {
    variant_id: req.validatedBody.variant_id,
    visitor_id: req.validatedBody.visitor_id,
    sales_channel_id: getRestockSalesChannelId(req),
  })
  res.status(201).json(result)
}
