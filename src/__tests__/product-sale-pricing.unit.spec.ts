import {
  buildManagedProductSaleMarker,
  getPublicProductSalePrices,
  parseManagedProductSaleMarker,
  resolveProductSaleStatus,
  validateProductSalePricingInput,
} from "../lib/product-sale-pricing"

const variants = [{
  id: "variant_1",
  title: "Default",
  prices: [{ amount: 10000, currency_code: "usd" }],
}]

describe("product sale pricing", () => {
  it("builds and parses managed sale markers", () => {
    const marker = buildManagedProductSaleMarker("prod_1", "variant_1")
    expect(marker).toBe("managed-product-sale:prod_1:variant_1")
    expect(parseManagedProductSaleMarker(marker)).toEqual({
      product_id: "prod_1",
      variant_id: "variant_1",
    })
    expect(parseManagedProductSaleMarker("manual price list")).toBeNull()
  })

  it("uses an inclusive start and exclusive end", () => {
    const priceList = {
      status: "active" as const,
      starts_at: "2026-08-01T00:00:00.000Z",
      ends_at: "2026-08-02T00:00:00.000Z",
    }
    expect(resolveProductSaleStatus(
      priceList,
      new Date("2026-07-31T23:59:59.999Z")
    )).toBe("scheduled")
    expect(resolveProductSaleStatus(
      priceList,
      new Date("2026-08-01T00:00:00.000Z")
    )).toBe("active")
    expect(resolveProductSaleStatus(
      priceList,
      new Date("2026-08-02T00:00:00.000Z")
    )).toBe("ended")
  })

  it("validates amount, currency, schedule, and product ownership", () => {
    const valid = [{
      variant_id: "variant_1",
      enabled: true,
      mode: "scheduled" as const,
      amount: 8000,
      currency_code: "usd",
      starts_at: "2026-08-01T00:00:00.000Z",
      ends_at: "2026-08-02T00:00:00.000Z",
    }]
    expect(() =>
      validateProductSalePricingInput("prod_1", valid, variants)
    ).not.toThrow()
    expect(() =>
      validateProductSalePricingInput(
        "prod_1",
        [{ ...valid[0], amount: 10000 }],
        variants
      )
    ).toThrow("优惠价必须低于原价")
    expect(() =>
      validateProductSalePricingInput(
        "prod_1",
        [{ ...valid[0], ends_at: valid[0].starts_at }],
        variants
      )
    ).toThrow("结束时间必须晚于开始时间")
    expect(() =>
      validateProductSalePricingInput(
        "prod_1",
        [{ ...valid[0], variant_id: "variant_other" }],
        variants
      )
    ).toThrow("不属于商品")
  })

  it("only exposes active and upcoming enabled sale windows to the store", () => {
    const base = {
      amount: 8000,
      currency_code: "usd",
      starts_at: null,
      ends_at: null,
      mode: "ongoing" as const,
    }
    expect(getPublicProductSalePrices([
      { ...base, variant_id: "active", enabled: true, status: "active" },
      { ...base, variant_id: "scheduled", enabled: true, status: "scheduled" },
      { ...base, variant_id: "ended", enabled: true, status: "ended" },
      { ...base, variant_id: "disabled", enabled: false, status: "disabled" },
    ])).toEqual([
      expect.objectContaining({ variant_id: "active", status: "active" }),
      expect.objectContaining({ variant_id: "scheduled", status: "scheduled" }),
    ])
  })
})
