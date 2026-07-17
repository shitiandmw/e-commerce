export type CheckoutContactInput = {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export type PickupContactError =
  | "first_name_required"
  | "last_name_required"
  | "phone_required"
  | "email_required"
  | "email_invalid"

export const CHECKOUT_SERVICE_ZONE_INVALID =
  "SHIPPING_OPTION_SERVICE_ZONE_INVALID"

export function getCheckoutCartErrorTranslationKey(errorCode?: string) {
  if (errorCode === CHECKOUT_SERVICE_ZONE_INVALID) {
    return "checkout_pickup_service_zone_invalid" as const
  }
  return null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePickupContact(
  contact: CheckoutContactInput
): PickupContactError | null {
  if (!contact.firstName.trim()) return "first_name_required"
  if (!contact.lastName.trim()) return "last_name_required"
  if (!contact.phone.trim()) return "phone_required"

  const email = contact.email.trim()
  if (!email) return "email_required"
  if (!EMAIL_PATTERN.test(email)) return "email_invalid"

  return null
}

export function buildPickupCartContact(contact: CheckoutContactInput) {
  return {
    first_name: contact.firstName.trim(),
    last_name: contact.lastName.trim(),
    phone: contact.phone.trim(),
  }
}
