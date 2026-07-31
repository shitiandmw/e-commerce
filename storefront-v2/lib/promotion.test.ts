import { describe, expect, it } from "vitest"

import {
  getManualPromotionCodes,
  hasPromotionCode,
  normalizePromotionCode,
} from "./promotion"

describe("cart promotion helpers", () => {
  it("normalizes codes for checkout submission", () => {
    expect(normalizePromotionCode(" summer-20 ")).toBe("SUMMER-20")
  })

  it("returns only manually applied promotion codes", () => {
    expect(getManualPromotionCodes([
      { code: "manual10", is_automatic: false },
      { code: "automatic10", is_automatic: true },
    ])).toEqual(["MANUAL10"])
  })

  it("matches applied codes without case sensitivity", () => {
    expect(hasPromotionCode([{ code: "SUMMER20" }], "summer20")).toBe(true)
  })
})
