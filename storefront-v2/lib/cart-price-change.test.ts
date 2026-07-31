import { describe, expect, it } from "vitest"
import {
  didStoredCartPriceChange,
  snapshotCartPrices,
} from "./cart-price-change"
import type { Cart } from "./cart"

function cart(items: Array<{ id: string; unit_price: number }>): Cart {
  return {
    id: "cart_1",
    items: items.map((item) => ({
      ...item,
      title: item.id,
      quantity: 1,
      total: item.unit_price,
      variant_id: `variant_${item.id}`,
    })),
  }
}

describe("cart price snapshots", () => {
  it("detects repricing of an existing line", () => {
    expect(didStoredCartPriceChange(
      { line_1: 1000 },
      cart([{ id: "line_1", unit_price: 800 }])
    )).toBe(true)
  })

  it("does not treat newly added lines as repricing", () => {
    expect(didStoredCartPriceChange(
      { line_1: 1000 },
      cart([
        { id: "line_1", unit_price: 1000 },
        { id: "line_2", unit_price: 800 },
      ])
    )).toBe(false)
    expect(snapshotCartPrices(cart([{ id: "line_1", unit_price: 1000 }]))).toEqual({
      line_1: 1000,
    })
  })
})
