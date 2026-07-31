import type { Cart } from "./cart"

export type CartPriceSnapshot = Record<string, number>

export function snapshotCartPrices(cart: Cart): CartPriceSnapshot {
  return Object.fromEntries(
    (cart.items || []).map((item) => [item.id, item.unit_price])
  )
}

export function didStoredCartPriceChange(
  previous: CartPriceSnapshot | null,
  cart: Cart
) {
  if (!previous) return false
  return (cart.items || []).some((item) =>
    Object.prototype.hasOwnProperty.call(previous, item.id) &&
    previous[item.id] !== item.unit_price
  )
}
