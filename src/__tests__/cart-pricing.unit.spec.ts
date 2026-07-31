import {
  getCartItemSaleEnd,
  getCompareAtPriceResetUpdates,
} from "../lib/cart-pricing"

describe("cart compare-at price normalization", () => {
  it.each([
    ["active sale", 8000, 10000],
    ["ended sale", 10000, 10000],
    ["ended sale after base price reduction", 9000, 10000],
  ])("clears a stale standard-item value before %s repricing", (
    _scenario,
    _unitPrice,
    compareAtUnitPrice
  ) => {
    expect(getCompareAtPriceResetUpdates([{
      id: "item_1",
      is_custom_price: false,
      compare_at_unit_price: compareAtUnitPrice,
    }])).toEqual([{
      selector: { id: "item_1" },
      data: { compare_at_unit_price: null },
    }])
  })

  it("leaves a cleared item ready for a new sale price", () => {
    expect(getCompareAtPriceResetUpdates([{
      id: "item_1",
      is_custom_price: false,
      compare_at_unit_price: null,
    }])).toEqual([])
  })

  it("preserves a custom-price item's manually supplied compare-at value", () => {
    expect(getCompareAtPriceResetUpdates([{
      id: "item_custom",
      is_custom_price: true,
      compare_at_unit_price: 12000,
    }])).toEqual([])
  })

  it("attaches an end time only when the active sale is the actual item price", () => {
    const item = {
      id: "item_1",
      variant_id: "variant_1",
      unit_price: 8000,
      is_custom_price: false,
    }
    const sale = {
      variant_id: "variant_1",
      amount: 8000,
      currency_code: "usd",
      starts_at: "2026-08-01T00:00:00.000Z",
      ends_at: "2026-08-02T00:00:00.000Z",
      status: "active" as const,
    }

    expect(getCartItemSaleEnd(item, "usd", [sale])).toBe(sale.ends_at)
    expect(getCartItemSaleEnd({ ...item, unit_price: 7500 }, "usd", [sale])).toBeNull()
    expect(getCartItemSaleEnd({ ...item, is_custom_price: true }, "usd", [sale])).toBeNull()
    expect(getCartItemSaleEnd(item, "eur", [sale])).toBeNull()
  })

  it("matches Medusa numeric wrappers before the cart is serialized", () => {
    const sale = {
      variant_id: "variant_1",
      amount: 8000,
      currency_code: "usd",
      starts_at: null,
      ends_at: "2026-08-02T00:00:00.000Z",
      status: "active" as const,
    }
    const item = {
      id: "item_1",
      variant_id: "variant_1",
      unit_price: { valueOf: () => "8000" },
      is_custom_price: false,
    }

    expect(getCartItemSaleEnd(item, "usd", [sale])).toBe(sale.ends_at)
  })
})
