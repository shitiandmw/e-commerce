import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { removeWishlistItemWorkflow } from "../../../../workflows/wishlist/remove-wishlist-item"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { id } = req.params

  await removeWishlistItemWorkflow(req.scope).run({
    input: {
      id,
      customer_id: customerId,
    },
  })

  return res.json({ id, deleted: true })
}
