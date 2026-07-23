import {
  findSellableVariantByOptionValueIds,
  isOptionValueCombinationAvailable,
} from "../../storefront-v2/lib/product-availability"

const variants = [
  {
    id: "variant_red_small",
    options: [
      { option_id: "option_color", id: "value_color_red" },
      { option_id: "option_size", id: "value_size_small" },
    ],
  },
  {
    id: "variant_blue_small",
    options: [
      { option_id: "option_color", id: "value_color_blue" },
      { option_id: "option_size", id: "value_size_small" },
    ],
    metadata: { sales_disabled: true },
  },
  {
    id: "variant_blue_large",
    options: [
      { option_id: "option_color", id: "value_color_blue" },
      { option_id: "option_size", id: "value_size_large" },
    ],
  },
]

describe("product variant option-value selection", () => {
  it("matches a variant by option and option-value IDs", () => {
    const selected = findSellableVariantByOptionValueIds(
      variants,
      ["option_color", "option_size"],
      {
        option_color: "value_color_red",
        option_size: "value_size_small",
      }
    )

    expect(selected?.id).toBe("variant_red_small")
  })

  it("does not match incomplete selections or stopped variants", () => {
    expect(findSellableVariantByOptionValueIds(
      variants,
      ["option_color", "option_size"],
      { option_color: "value_color_red" }
    )).toBeUndefined()

    expect(findSellableVariantByOptionValueIds(
      variants,
      ["option_color", "option_size"],
      {
        option_color: "value_color_blue",
        option_size: "value_size_small",
      }
    )).toBeUndefined()
  })

  it("only enables partial combinations that lead to a sellable variant", () => {
    expect(isOptionValueCombinationAvailable(variants, {
      option_color: "value_color_blue",
      option_size: "value_size_small",
    })).toBe(false)
    expect(isOptionValueCombinationAvailable(variants, {
      option_color: "value_color_blue",
      option_size: "value_size_large",
    })).toBe(true)
  })
})
