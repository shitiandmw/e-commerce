import {
  addShippingMethodToCartWorkflow,
  completeCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  assertCartShippingSnapshot,
  assertCartSupportsShippingOption,
  createShippingAvailabilityError,
  SHIPPING_AVAILABILITY_ERROR_CODES,
} from "../../lib/shipping-availability"

addShippingMethodToCartWorkflow.hooks.validate(
  async ({ input }, { container }) => {
    const optionIds = input.options?.map((option) => option.id) ?? []
    if (optionIds.length !== 1) {
      throw createShippingAvailabilityError(
        SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_REQUIRED,
        "Exactly one shipping option must be selected."
      )
    }
    await assertCartSupportsShippingOption(container, input.cart_id, optionIds[0])
  }
)

completeCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const availability = await getSelectedAvailability(container, input.id)
  await assertCartSupportsShippingOption(
    container,
    input.id,
    availability.shippingOptionId
  )
  await assertCartShippingSnapshot(container, input.id)
})

async function getSelectedAvailability(container: any, cartId: string) {
  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "shipping_methods.shipping_option_id"],
    filters: { id: cartId },
  })
  return {
    shippingOptionId: data?.[0]?.shipping_methods?.[0]?.shipping_option_id ?? "",
  }
}
