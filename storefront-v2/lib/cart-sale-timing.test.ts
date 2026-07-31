import { describe, expect, it } from "vitest"
import type { Cart, CartLineItem } from "./cart"
import { mergeCartSaleTiming } from "./cart-sale-timing"

function item(overrides: Partial<CartLineItem> = {}): CartLineItem {
  return {
    id: "item_1",
    title: "Product",
    quantity: 1,
    unit_price: 8000,
    compare_at_unit_price: 10000,
    total: 8000,
    variant_id: "variant_1",
    ...overrides,
  }
}

describe("cart sale timing merge", () => {
  const previous: Cart = {
    id: "cart_1",
    pricing_refreshed_at: "2026-08-01T00:00:00.000Z",
    items: [item({ sale_ends_at: "2026-08-02T00:00:00.000Z" })],
  }

  it("preserves timing after a quantity-only response", () => {
    const merged = mergeCartSaleTiming(previous, {
      id: "cart_1",
      items: [item({ quantity: 2, total: 16000 })],
    })
    expect(merged.items?.[0].sale_ends_at).toBe("2026-08-02T00:00:00.000Z")
    expect(merged.pricing_refreshed_at).toBe("2026-08-01T00:00:00.000Z")
  })

  it("does not preserve timing when the effective price changes", () => {
    const merged = mergeCartSaleTiming(previous, {
      id: "cart_1",
      items: [item({ unit_price: 9000, total: 9000 })],
    })
    expect(merged.items?.[0].sale_ends_at).toBeUndefined()
    expect(merged.pricing_refreshed_at).toBeUndefined()
  })

  it("honors an explicit null returned by repricing", () => {
    const merged = mergeCartSaleTiming(previous, {
      id: "cart_1",
      pricing_refreshed_at: "2026-08-02T00:00:00.000Z",
      items: [item({ sale_ends_at: null })],
    })
    expect(merged.items?.[0].sale_ends_at).toBeNull()
  })
})
