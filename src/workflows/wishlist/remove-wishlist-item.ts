import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../modules/wishlist"

type RemoveWishlistItemInput = {
  id: string
  customer_id: string
}

export const removeWishlistItemStep = createStep(
  "remove-wishlist-item",
  async (input: RemoveWishlistItemInput, { container }) => {
    const wishlistService = container.resolve(WISHLIST_MODULE)

    const item = await wishlistService.retrieveWishlistItem(input.id)

    if (item.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You can only remove your own wishlist items"
      )
    }

    await wishlistService.deleteWishlistItems(input.id)

    return new StepResponse({ id: input.id }, item)
  },
  async (item, { container }) => {
    if (!item) return
    const wishlistService = container.resolve(WISHLIST_MODULE)
    await wishlistService.createWishlistItems({
      customer_id: item.customer_id,
      product_id: item.product_id,
    })
  }
)

export const removeWishlistItemWorkflow = createWorkflow(
  "remove-wishlist-item",
  function (input: RemoveWishlistItemInput) {
    const result = removeWishlistItemStep(input)
    return new WorkflowResponse(result)
  }
)
