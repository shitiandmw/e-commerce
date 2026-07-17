import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  assertPickupLocationCanBeDeleted,
} from "../../lib/shipping-availability"
import { PICKUP_LOCATION_MODULE } from "../../modules/pickup-location"
import type PickupLocationModuleService from "../../modules/pickup-location/service"
import { SHIPPING_OPTION_CONFIGURATION_LOCK } from "../shipping-option/update-shipping-option-configuration"

export type PickupLocationUpdate = {
  name?: string
  address?: string
  country_code?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  phone?: string | null
  hours?: string | null
  note?: string | null
  sort_order?: number
  is_enabled?: boolean
}

type UpdatePickupLocationInput = {
  id: string
  update: PickupLocationUpdate
}

function toPersistedPickupLocation(location: any) {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    country_code: location.country_code ?? null,
    city: location.city ?? null,
    province: location.province ?? null,
    postal_code: location.postal_code ?? null,
    phone: location.phone ?? null,
    hours: location.hours ?? null,
    note: location.note ?? null,
    sort_order: location.sort_order,
    is_enabled: location.is_enabled,
  }
}

async function retrievePickupLocation(
  service: PickupLocationModuleService,
  id: string
) {
  const [location] = await service.listPickupLocations({ id: [id] } as any)
  if (!location) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Pickup location not found"
    )
  }
  return location
}

const updatePickupLocationStep = createStep(
  "update-locked-pickup-location-step",
  async (input: UpdatePickupLocationInput, { container }) => {
    const service = container.resolve(
      PICKUP_LOCATION_MODULE
    ) as PickupLocationModuleService
    const current = await retrievePickupLocation(service, input.id)

    if (input.update.is_enabled === false) {
      await assertPickupLocationCanBeDeleted(container, input.id)
    }
    const updated = await service.updatePickupLocations({
      id: input.id,
      ...input.update,
    })
    return new StepResponse(updated, toPersistedPickupLocation(current))
  },
  async (previous: Record<string, unknown> | undefined, { container }) => {
    if (!previous) return
    const service = container.resolve(
      PICKUP_LOCATION_MODULE
    ) as PickupLocationModuleService
    await service.updatePickupLocations(previous as any)
  }
)

const deletePickupLocationStep = createStep(
  "delete-locked-pickup-location-step",
  async (id: string, { container }) => {
    const service = container.resolve(
      PICKUP_LOCATION_MODULE
    ) as PickupLocationModuleService
    const current = await retrievePickupLocation(service, id)
    await assertPickupLocationCanBeDeleted(container, id)
    await service.deletePickupLocations(id)

    return new StepResponse(
      { id, object: "pickup_location", deleted: true },
      toPersistedPickupLocation(current)
    )
  },
  async (previous: Record<string, unknown> | undefined, { container }) => {
    if (!previous) return
    const service = container.resolve(
      PICKUP_LOCATION_MODULE
    ) as PickupLocationModuleService
    await service.createPickupLocations(previous as any)
  }
)

function acquirePickupConfigurationLock() {
  return acquireLockStep({
    key: SHIPPING_OPTION_CONFIGURATION_LOCK,
    timeout: 10,
    ttl: 60,
  })
}

function releasePickupConfigurationLock(dependency: unknown) {
  const releaseInput = transform(
    { dependency },
    () => ({ key: SHIPPING_OPTION_CONFIGURATION_LOCK })
  )
  releaseLockStep(releaseInput)
}

export const updatePickupLocationWorkflow = createWorkflow(
  "update-locked-pickup-location",
  (input: UpdatePickupLocationInput) => {
    const lock = acquirePickupConfigurationLock()
    const lockedInput = transform({ input, lock }, ({ input }) => input)
    const result = updatePickupLocationStep(lockedInput)
    releasePickupConfigurationLock(result)

    return new WorkflowResponse(result)
  }
)

export const deletePickupLocationWorkflow = createWorkflow(
  "delete-locked-pickup-location",
  (id: string) => {
    const lock = acquirePickupConfigurationLock()
    const lockedId = transform({ id, lock }, ({ id }) => id)
    const result = deletePickupLocationStep(lockedId)
    releasePickupConfigurationLock(result)

    return new WorkflowResponse(result)
  }
)
