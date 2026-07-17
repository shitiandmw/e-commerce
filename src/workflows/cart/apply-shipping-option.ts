import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addShippingMethodToCartWorkflow,
  updateCartsStep,
} from "@medusajs/medusa/core-flows"
import { preflightCartShippingOption } from "../../lib/shipping-availability"

export type ApplyShippingOptionInput = {
  cart_id: string
  option_id: string
  data?: Record<string, unknown>
  additional_data?: Record<string, unknown>
}

const preflightShippingOptionStep = createStep(
  "preflight-cart-shipping-option",
  async (input: ApplyShippingOptionInput, { container }) => {
    const result = await preflightCartShippingOption(
      container,
      input.cart_id,
      input.option_id
    )

    return new StepResponse({
      ...input,
      shipping_address: result.shipping_address,
    })
  }
)

export const applyShippingOptionWorkflow = createWorkflow(
  "apply-shipping-option-to-cart",
  (input: ApplyShippingOptionInput) => {
    const preflight = preflightShippingOptionStep(input)
    const cartUpdates = transform(preflight, (prepared) =>
      prepared.shipping_address
        ? [{
            id: prepared.cart_id,
            shipping_address: prepared.shipping_address,
          }]
        : []
    )
    // Medusa's public DTO omits nullable address clears, while the cart service
    // and the compensating core step support them.
    const updatedCarts = updateCartsStep(cartUpdates as any)
    const coreInput = transform(
      { preflight, updatedCarts },
      ({ preflight }) => ({
        cart_id: preflight.cart_id,
        options: [{ id: preflight.option_id, data: preflight.data }],
        additional_data: preflight.additional_data,
      })
    )
    const result = addShippingMethodToCartWorkflow.runAsStep({
      input: coreInput,
    })

    return new WorkflowResponse(result)
  }
)
