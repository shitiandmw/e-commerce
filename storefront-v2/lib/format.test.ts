import { describe, expect, it } from "vitest"
import { formatPrice } from "./format"

describe("formatPrice", () => {
  it("uses the currency fraction digits", () => {
    expect(formatPrice(1234, "usd")).toContain("12.34")
    expect(formatPrice(1234, "jpy")).toContain("1,234")
  })
})
