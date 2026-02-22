import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { WISHLIST_MODULE } from "../../modules/wishlist"

type AddWishlistItemInput = {
  customer_id: string
  product_id: string
}

export const addWishlistItemStep = createStep(
  "add-wishlist-item",
  async (input: AddWishlistItemInput, { container }) => {
    const wishlistService = container.resolve(WISHLIST_MODULE)

    // Check if already exists
    const existing = await wishlistService.listWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
    })

    if (existing.length > 0) {
      return new StepResponse(existing[0])
    }

    const item = await wishlistService.createWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
    })

    return new StepResponse(item, item.id)
  },
  async (id, { container }) => {
    if (!id) return
    const wishlistService = container.resolve(WISHLIST_MODULE)
    await wishlistService.deleteWishlistItems(id)
  }
)

export const addWishlistItemWorkflow = createWorkflow(
  "add-wishlist-item",
  function (input: AddWishlistItemInput) {
    const item = addWishlistItemStep(input)
    return new WorkflowResponse(item)
  }
)
