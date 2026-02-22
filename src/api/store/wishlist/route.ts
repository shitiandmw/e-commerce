import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import { addWishlistItemWorkflow } from "../../../workflows/wishlist/add-wishlist-item"
import { AddWishlistItemSchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const wishlistService = req.scope.resolve(WISHLIST_MODULE)

  const items = await wishlistService.listWishlistItems(
    { customer_id: customerId },
    { order: { created_at: "DESC" } }
  )

  return res.json({ wishlist_items: items })
}

export async function POST(
  req: AuthenticatedMedusaRequest<AddWishlistItemSchema>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { product_id } = req.validatedBody

  const { result } = await addWishlistItemWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
    },
  })

  return res.json({ wishlist_item: result })
}
