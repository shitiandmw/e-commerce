import type { Cart, CartLineItem } from "./cart"

function canPreserveSaleTiming(
  previous: CartLineItem,
  current: CartLineItem
) {
  return (
    previous.unit_price === current.unit_price &&
    previous.compare_at_unit_price === current.compare_at_unit_price
  )
}

export function mergeCartSaleTiming(
  previousCart: Cart | null,
  currentCart: Cart
): Cart {
  if (!previousCart?.items?.length || !currentCart.items?.length) {
    return currentCart
  }
  const previousById = new Map(
    previousCart.items.map((item) => [item.id, item])
  )
  let preservedTiming = false
  const items = currentCart.items.map((item) => {
    if (item.sale_ends_at !== undefined) return item
    const previous = previousById.get(item.id)
    if (!previous || !canPreserveSaleTiming(previous, item)) return item
    if (previous.sale_ends_at === undefined) return item
    preservedTiming = true
    return { ...item, sale_ends_at: previous.sale_ends_at }
  })

  return {
    ...currentCart,
    items,
    pricing_refreshed_at:
      currentCart.pricing_refreshed_at ??
      (preservedTiming ? previousCart.pricing_refreshed_at : undefined),
  }
}
