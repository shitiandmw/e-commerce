import { describe, expect, it } from "vitest"
import {
  CHECKOUT_REMOVAL_ERROR_CODES,
  getCheckoutRemovalError,
} from "./checkout-incompatible-removal"

describe("checkout incompatible item removal", () => {
  it("blocks removing the only line item", () => {
    expect(getCheckoutRemovalError(
      ["item_a"],
      ["item_a"],
      ["item_a"]
    )).toBe(CHECKOUT_REMOVAL_ERROR_CODES.KEEP_ONE)
  })

  it("blocks a batch that covers every line item", () => {
    expect(getCheckoutRemovalError(
      ["item_a", "item_b"],
      ["item_a", "item_b"],
      ["item_b", "item_a"]
    )).toBe(CHECKOUT_REMOVAL_ERROR_CODES.KEEP_ONE)
  })

  it("allows removing only the incompatible subset", () => {
    expect(getCheckoutRemovalError(
      ["item_a", "item_b"],
      ["item_a"],
      ["item_a"]
    )).toBeNull()
  })

  it("rejects a stale repeated request without another mutation", () => {
    expect(getCheckoutRemovalError(
      ["item_b"],
      [],
      ["item_a"]
    )).toBe(CHECKOUT_REMOVAL_ERROR_CODES.ITEMS_CHANGED)
  })
})
