import type { FulfillmentWorkflow } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createShippingAvailabilityError,
  getShippingOptionPickupLocation,
  restoreShippingOptionPickupLocation,
  SHIPPING_AVAILABILITY_ERROR_CODES,
  syncShippingOptionPickupLocation,
  validateShippingOptionPickupLocationTarget,
} from "../../lib/shipping-availability"

export const SHIPPING_OPTION_CONFIGURATION_LOCK =
  "shipping-option-configuration"

export type UpdateShippingOptionConfigurationInput = {
  id: string
  shipping_option: Omit<
    FulfillmentWorkflow.UpdateShippingOptionsWorkflowInput,
    "id"
  > & {
    metadata?: Record<string, unknown>
  }
  pickup_location_id: string | null
}

const prevalidateShippingOptionConfigurationStep = createStep(
  "prevalidate-shipping-option-configuration-step",
  async (input: UpdateShippingOptionConfigurationInput, { container }) => {
    const fulfillment = container.resolve(Modules.FULFILLMENT) as any
    const [currentOption] = await fulfillment.listShippingOptions({
      id: [input.id],
    })
    if (!currentOption) {
      throw createShippingAvailabilityError(
        SHIPPING_AVAILABILITY_ERROR_CODES.OPTION_NOT_FOUND,
        "Shipping option not found.",
        { shipping_option_id: input.id }
      )
    }

    const targetType = String(
      input.shipping_option.metadata?.type ??
        currentOption.metadata?.type ??
        "delivery"
    ).toLowerCase()
    await validateShippingOptionPickupLocationTarget(
      container,
      input.id,
      input.pickup_location_id,
      targetType === "pickup"
    )

    return new StepResponse(input)
  }
)

export const syncShippingOptionConfigurationBindingStep = createStep(
  "sync-shipping-option-configuration-binding-step",
  async (
    input: {
      id: string
      pickup_location_id: string | null
    },
    { container }
  ) => {
    const previous = await getShippingOptionPickupLocation(container, input.id)
    const result = await syncShippingOptionPickupLocation(
      container,
      input.id,
      input.pickup_location_id
    )
    return new StepResponse(result, {
      id: input.id,
      pickup_location_id: previous.pickup_location_id,
    })
  },
  async (
    previous: { id: string; pickup_location_id: string | null } | undefined,
    { container }
  ) => {
    if (!previous) return
    await restoreShippingOptionPickupLocation(
      container,
      previous.id,
      previous.pickup_location_id
    )
  }
)

export const updateShippingOptionConfigurationWorkflow = createWorkflow(
  "update-shipping-option-configuration",
  (input: UpdateShippingOptionConfigurationInput) => {
    const lock = acquireLockStep({
      key: SHIPPING_OPTION_CONFIGURATION_LOCK,
      timeout: 10,
      ttl: 60,
    })
    const lockedInput = transform({ input, lock }, ({ input }) => input)
    const validatedInput = prevalidateShippingOptionConfigurationStep(lockedInput)
    const updateInput = transform(validatedInput, (validated) => [
      {
        id: validated.id,
        ...validated.shipping_option,
      },
    ])
    const updatedOptions = updateShippingOptionsWorkflow.runAsStep({
      input: updateInput,
    })
    const bindingInput = transform(
      { validatedInput, updatedOptions },
      ({ validatedInput }) => ({
        id: validatedInput.id,
        pickup_location_id: validatedInput.pickup_location_id,
      })
    )
    const binding = syncShippingOptionConfigurationBindingStep(bindingInput)
    const releaseInput = transform(
      { binding },
      () => ({ key: SHIPPING_OPTION_CONFIGURATION_LOCK })
    )
    releaseLockStep(releaseInput)

    return new WorkflowResponse(updatedOptions)
  }
)

export const syncShippingOptionPickupLocationWorkflow = createWorkflow(
  "sync-shipping-option-pickup-location",
  (input: { id: string; pickup_location_id: string | null }) => {
    const lock = acquireLockStep({
      key: SHIPPING_OPTION_CONFIGURATION_LOCK,
      timeout: 10,
      ttl: 60,
    })
    const bindingInput = transform({ input, lock }, ({ input }) => input)
    const binding = syncShippingOptionConfigurationBindingStep(bindingInput)
    const releaseInput = transform(
      { binding },
      () => ({ key: SHIPPING_OPTION_CONFIGURATION_LOCK })
    )
    releaseLockStep(releaseInput)

    return new WorkflowResponse(binding)
  }
)
