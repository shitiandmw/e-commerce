import { z } from "zod"

export const productShippingOptionIdsSchema = z
  .array(z.string())
  .min(1, "At least one shipping option is required")

export function toggleShippingOptionId(
  currentIds: string[],
  optionId: string,
  checked: boolean
) {
  const ids = Array.from(new Set(currentIds.filter(Boolean)))
  if (checked) {
    return ids.includes(optionId) ? ids : [...ids, optionId]
  }
  return ids.filter((id) => id !== optionId)
}

export type PickupLocationUnavailabilityReason =
  | "disabled"
  | "already_assigned"
  | "unavailable"

type PickupLocationCandidate = {
  is_enabled: boolean
  shipping_option_id?: string | null
}

export function getPickupLocationUnavailabilityReason(
  location: PickupLocationCandidate,
  currentShippingOptionId?: string
): PickupLocationUnavailabilityReason | null {
  if (!location.is_enabled) return "disabled"
  if (
    location.shipping_option_id &&
    location.shipping_option_id !== currentShippingOptionId
  ) {
    return "already_assigned"
  }

  return null
}

export type PickupLocationOptionState = {
  location: { id: string }
  reason: PickupLocationUnavailabilityReason | null
}

export function getSelectedPickupLocationReason(
  pickupLocationId: string,
  options: PickupLocationOptionState[],
  validationReady: boolean
): PickupLocationUnavailabilityReason | null {
  if (!pickupLocationId || !validationReady) return null

  const selectedOption = options.find(
    (option) => option.location.id === pickupLocationId
  )
  return selectedOption ? selectedOption.reason : "unavailable"
}
