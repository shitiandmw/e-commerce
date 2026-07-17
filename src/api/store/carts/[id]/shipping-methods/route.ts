import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { applyShippingOptionWorkflow } from "../../../../../workflows/cart/apply-shipping-option"

type StoreAddShippingMethodBody = {
  option_id: string
  data?: Record<string, unknown>
  additional_data?: Record<string, unknown>
}

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
  const payload = req.validatedBody as StoreAddShippingMethodBody
  await applyShippingOptionWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      option_id: payload.option_id,
      data: payload.data,
      additional_data: payload.additional_data,
    },
  })

  const cart = await refetchCart(req)
  res.status(200).json({ cart })
}
