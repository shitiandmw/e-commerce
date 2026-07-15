import { buildRestockIdentity, isVariantOutOfStock } from "../lib/restock-demand"
import { MedusaError } from "@medusajs/framework/utils"

describe("restock demand", () => {
  it("uses the customer identity before the browser identity", () => {
    expect(buildRestockIdentity("cus_123", "browser_123")).toBe("customer:cus_123")
  })

  it("uses a stable browser identity for visitors", () => {
    expect(buildRestockIdentity(null, "browser_123")).toBe("visitor:browser_123")
  })

  it("returns a typed 4xx error when an anonymous identity is missing", () => {
    expect(() => buildRestockIdentity(null, null)).toThrow(MedusaError)
    try {
      buildRestockIdentity(null, null)
    } catch (error) {
      expect((error as MedusaError).type).toBe(MedusaError.Types.INVALID_DATA)
    }
  })

  it("only treats inventory-managed variants without stock as out of stock", () => {
    expect(isVariantOutOfStock(true, 0)).toBe(true)
    expect(isVariantOutOfStock(true, -1)).toBe(true)
    expect(isVariantOutOfStock(true, 1)).toBe(false)
    expect(isVariantOutOfStock(false, 0)).toBe(false)
  })
})
