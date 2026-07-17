export const CHECKOUT_REMOVAL_ERROR_CODES = {
  KEEP_ONE: "SHIPPING_INCOMPATIBLE_ITEMS_KEEP_ONE",
  ITEMS_CHANGED: "SHIPPING_INCOMPATIBLE_ITEMS_CHANGED",
} as const

export type CheckoutRemovalErrorCode =
  typeof CHECKOUT_REMOVAL_ERROR_CODES[keyof typeof CHECKOUT_REMOVAL_ERROR_CODES]

function normalizeIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)))
}

export function getCheckoutRemovalError(
  cartLineItemIds: string[],
  incompatibleLineItemIds: string[],
  requestedLineItemIds: string[]
): CheckoutRemovalErrorCode | null {
  const cartIds = normalizeIds(cartLineItemIds)
  const cartIdSet = new Set(cartIds)
  const incompatibleIdSet = new Set(normalizeIds(incompatibleLineItemIds))
  const requestedIds = normalizeIds(requestedLineItemIds)

  if (
    requestedIds.length === 0 ||
    requestedIds.some(
      (id) => !cartIdSet.has(id) || !incompatibleIdSet.has(id)
    )
  ) {
    return CHECKOUT_REMOVAL_ERROR_CODES.ITEMS_CHANGED
  }

  if (cartIds.length - requestedIds.length < 1) {
    return CHECKOUT_REMOVAL_ERROR_CODES.KEEP_ONE
  }

  return null
}
