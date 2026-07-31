import {
  getPromotionCodePolicyError,
  MULTIPLE_PROMOTION_CODES_MESSAGE,
  normalizePromotionCodes,
  REPLACE_PROMOTION_CODE_MESSAGE,
} from "../lib/promotion-code-policy"

describe("promotion code policy", () => {
  it("normalizes and deduplicates requested codes", () => {
    expect(normalizePromotionCodes([" first10 ", "FIRST10", null]))
      .toEqual(["FIRST10"])
  })

  it("rejects multiple codes in one request", () => {
    expect(getPromotionCodePolicyError(["FIRST10", "SECOND10"]))
      .toBe(MULTIPLE_PROMOTION_CODES_MESSAGE)
  })

  it("allows reapplying the current code and ignores automatic promotions", () => {
    expect(getPromotionCodePolicyError(["FIRST10"], [
      { code: "AUTO10", is_automatic: true },
      { code: "first10", is_automatic: false },
    ])).toBeNull()
  })

  it("requires removal before replacing a manual code", () => {
    expect(getPromotionCodePolicyError(["SECOND10"], [
      { code: "FIRST10", is_automatic: false },
    ])).toBe(REPLACE_PROMOTION_CODE_MESSAGE)
  })
})
