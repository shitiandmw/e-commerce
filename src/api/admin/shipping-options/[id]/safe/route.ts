import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"
import {
  assertShippingOptionCanBeDeleted,
  deleteShippingOptionPickupBinding,
} from "../../../../../lib/shipping-availability"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = req.params.id
  await assertShippingOptionCanBeDeleted(req.scope, id)
  await deleteShippingOptionsWorkflow(req.scope).run({ input: { ids: [id] } })
  await deleteShippingOptionPickupBinding(req.scope, id)

  res.json({ id, object: "shipping_option", deleted: true })
}
