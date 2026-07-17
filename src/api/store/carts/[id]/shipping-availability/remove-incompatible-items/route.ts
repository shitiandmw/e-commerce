import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { removeIncompatibleItemsWorkflow } from "../../../../../../workflows/cart/remove-incompatible-items"
import type { PostStoreRemoveIncompatibleItemsType } from "../validators"

export const POST = async (
  req: MedusaRequest<PostStoreRemoveIncompatibleItemsType>,
  res: MedusaResponse
) => {
  const { result } = await removeIncompatibleItemsWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      shipping_option_id: req.validatedBody.shipping_option_id,
      line_item_ids: req.validatedBody.line_item_ids,
    },
  })

  res.status(200).json(result)
}
