import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  deleteLineItemsWorkflow,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"
import {
  getCartShippingAvailability,
  validateIncompatibleItemRemoval,
} from "../../lib/shipping-availability"

export type RemoveIncompatibleItemsInput = {
  cart_id: string
  shipping_option_id: string
  line_item_ids: string[]
}

const validateIncompatibleItemsRemovalStep = createStep(
  "validate-incompatible-items-removal-step",
  async (input: RemoveIncompatibleItemsInput, { container }) => {
    const availability = await getCartShippingAvailability(
      container,
      input.cart_id
    )
    const lineItemIds = validateIncompatibleItemRemoval(
      availability,
      input.shipping_option_id,
      input.line_item_ids
    )

    return new StepResponse({ ...input, line_item_ids: lineItemIds })
  }
)

export const removeIncompatibleItemsWorkflow = createWorkflow(
  "remove-incompatible-cart-items",
  (input: RemoveIncompatibleItemsInput) => {
    const lock = acquireLockStep({
      key: input.cart_id,
      timeout: 10,
      ttl: 60,
    })
    const lockedInput = transform({ input, lock }, ({ input }) => input)
    const validatedInput = validateIncompatibleItemsRemovalStep(lockedInput)
    const deletionInput = transform(validatedInput, (validated) => ({
      cart_id: validated.cart_id,
      ids: validated.line_item_ids,
    }))
    const deletion = deleteLineItemsWorkflow.runAsStep({
      input: deletionInput,
    })
    const releaseInput = transform(
      { deletion, validatedInput },
      ({ validatedInput }) => ({ key: validatedInput.cart_id })
    )
    releaseLockStep(releaseInput)

    const result = transform(validatedInput, (validated) => ({
      cart_id: validated.cart_id,
      removed_line_item_ids: validated.line_item_ids,
    }))
    return new WorkflowResponse(result)
  }
)
