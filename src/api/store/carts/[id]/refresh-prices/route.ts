import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  enrichCartWithSaleTiming,
  refreshCartPrices,
} from "../../../../../lib/cart-pricing"

async function refetchCart(req: MedusaRequest) {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const query = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id: req.params.id } },
    fields: req.queryConfig.fields,
  })
  const [cart] = await remoteQuery(query)
  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${req.params.id}' not found`
    )
  }
  return cart
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await refreshCartPrices(req.scope, req.params.id)
  const cart = await refetchCart(req)
  const cartWithSaleTiming = await enrichCartWithSaleTiming(
    req.scope,
    cart as any
  )
  res.status(200).json({ cart: cartWithSaleTiming })
}
