import { describe, expect, it } from "vitest"
import { getProductDisplayPrice } from "./products"

describe("product display price", () => {
  it("preserves the original amount for an active sale", () => {
    expect(getProductDisplayPrice({
      variants: [{
        calculated_price: {
          calculated_amount: 8000,
          original_amount: 10000,
          currency_code: "usd",
        },
      }],
    })).toEqual({
      amount: 8000,
      original_amount: 10000,
      currency_code: "usd",
    })
  })

  it("omits the strike price when calculated and original prices match", () => {
    expect(getProductDisplayPrice({
      variants: [{
        calculated_price: {
          calculated_amount: 10000,
          original_amount: 10000,
          currency_code: "usd",
        },
      }],
    })).toEqual({ amount: 10000, currency_code: "usd" })
  })
})
