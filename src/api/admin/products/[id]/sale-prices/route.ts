import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getProductSalePrices,
  syncProductSalePrices,
} from "../../../../../lib/product-sale-pricing"
import type { PostAdminProductSalePricesType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const salePrices = await getProductSalePrices(req.scope, req.params.id)
  res.status(200).json({ sale_prices: salePrices })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminProductSalePricesType>,
  res: MedusaResponse
) => {
  const salePrices = await syncProductSalePrices(
    req.scope,
    req.params.id,
    req.validatedBody.configurations
  )
  res.status(200).json({ sale_prices: salePrices })
}
