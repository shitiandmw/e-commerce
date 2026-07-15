import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  createRestockRequest,
  getRestockRequestStatus,
  getRestockSalesChannelId,
} from "../helpers"
import { StoreCustomerRestockRequestBodyType } from "../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const result = await getRestockRequestStatus(req.scope, {
    variant_id: req.query.variant_id as string,
    customer_id: req.auth_context.actor_id,
    sales_channel_id: getRestockSalesChannelId(req),
  })
  res.json(result)
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCustomerRestockRequestBodyType>,
  res: MedusaResponse
) {
  const result = await createRestockRequest(req.scope, {
    variant_id: req.validatedBody.variant_id,
    customer_id: req.auth_context.actor_id,
    sales_channel_id: getRestockSalesChannelId(req),
  })
  res.status(201).json(result)
}
