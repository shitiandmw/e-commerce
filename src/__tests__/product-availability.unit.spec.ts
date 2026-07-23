import {
  getSellableVariants,
  isProductOutOfStock,
  isVariantOutOfStock,
  prioritizeInStockProducts,
} from "../../storefront-v2/lib/product-availability"

type TestProduct = {
  id: string
  variants?: Array<{
    inventory_quantity?: number | null
    manage_inventory?: boolean | null
    metadata?: Record<string, unknown> | null
  }> | null
}

describe("product availability ordering", () => {
  it("moves known out-of-stock products behind available and unknown products stably", () => {
    const products: TestProduct[] = [
      { id: "sold-1", variants: [{ inventory_quantity: 0 }] },
      { id: "available-1", variants: [{ inventory_quantity: 3 }] },
      { id: "unknown", variants: [{ manage_inventory: true }] },
      { id: "sold-2", variants: [{ inventory_quantity: -2 }] },
      { id: "unmanaged", variants: [{ manage_inventory: false, inventory_quantity: 0 }] },
      { id: "available-2", variants: [{ inventory_quantity: 1 }] },
    ]

    const result = prioritizeInStockProducts(products)

    expect(result.map((product) => product.id)).toEqual([
      "available-1",
      "unknown",
      "unmanaged",
      "available-2",
      "sold-1",
      "sold-2",
    ])
    expect(products[0].id).toBe("sold-1")
  })

  it("preserves the original order when all products are available", () => {
    const products: TestProduct[] = [
      { id: "available-1", variants: [{ inventory_quantity: 1 }] },
      { id: "available-2", variants: [{ inventory_quantity: 8 }] },
    ]

    expect(prioritizeInStockProducts(products).map((product) => product.id)).toEqual([
      "available-1",
      "available-2",
    ])
  })

  it("preserves the original order when all products are out of stock", () => {
    const products: TestProduct[] = [
      { id: "sold-1", variants: [{ inventory_quantity: 0 }] },
      { id: "sold-2", variants: [{ inventory_quantity: -1 }] },
    ]

    expect(prioritizeInStockProducts(products).map((product) => product.id)).toEqual([
      "sold-1",
      "sold-2",
    ])
  })

  it("does not classify missing inventory data as out of stock", () => {
    const products: TestProduct[] = [
      { id: "no-variants" },
      { id: "null-variants", variants: null },
      { id: "missing-quantity", variants: [{ manage_inventory: true }] },
      { id: "null-quantity", variants: [{ inventory_quantity: null }] },
    ]

    expect(products.map(isProductOutOfStock)).toEqual([false, false, false, false])
  })

  it("only marks a multi-variant product out of stock when every variant is known unavailable", () => {
    expect(isProductOutOfStock({
      variants: [
        { inventory_quantity: 0 },
        { inventory_quantity: 2 },
      ],
    })).toBe(false)
    expect(isProductOutOfStock({
      variants: [
        { inventory_quantity: 0 },
        { inventory_quantity: -1 },
      ],
    })).toBe(true)
  })

  it("does not mark an unselected or inventory-unknown variant as out of stock", () => {
    expect(isVariantOutOfStock(undefined)).toBe(false)
    expect(isVariantOutOfStock({ manage_inventory: true })).toBe(false)
    expect(isVariantOutOfStock({ manage_inventory: true, inventory_quantity: 0 })).toBe(true)
  })

  it("excludes stopped variants from availability", () => {
    const variants = [
      { inventory_quantity: 8, metadata: { sales_disabled: true } },
      { inventory_quantity: 2 },
    ]

    expect(getSellableVariants(variants)).toEqual([variants[1]])
    expect(isProductOutOfStock({ variants })).toBe(false)
    expect(isProductOutOfStock({
      variants: [{ inventory_quantity: 8, metadata: { sales_disabled: true } }],
    })).toBe(true)
  })
})
