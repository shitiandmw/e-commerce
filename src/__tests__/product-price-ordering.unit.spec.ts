import {
  sortProductsByDisplayPrice,
  type ProductPriceOrder,
} from "../../storefront-v2/lib/data/products"
import {
  loadPrioritizedProductSelection,
  prioritizeInStockProducts,
} from "../../storefront-v2/lib/product-availability"

type PriceCandidate = {
  id: string
  variants: Array<{
    inventory_quantity: number
    prices?: Array<{ amount: number; currency_code: string }>
  }>
}

function candidate(id: string, inventory: number, amount?: number): PriceCandidate {
  return {
    id,
    variants: [{
      inventory_quantity: inventory,
      prices: amount === undefined ? [] : [{ amount, currency_code: "usd" }],
    }],
  }
}

function combinedOrder(products: PriceCandidate[], order: ProductPriceOrder) {
  return prioritizeInStockProducts(sortProductsByDisplayPrice(products, order))
}

describe("global inventory and price ordering", () => {
  it("moves a lower-priced product from a later batch onto the first ascending page", async () => {
    const batches = [
      [candidate("price-50", 5, 50), candidate("price-40", 5, 40)],
      [candidate("price-10", 5, 10)],
    ]

    const result = await loadPrioritizedProductSelection({
      fetchCandidateBatch: async ({ offset }) => ({
        products: batches[offset === 0 ? 0 : 1] ?? [],
        count: 3,
      }),
      fetchProductsByIds: async (ids) => ids.map((id) => ({ id })),
      limit: 2,
      batchSize: 2,
      sortCandidates: (products) => sortProductsByDisplayPrice(products, "asc"),
    })

    expect(result.products.map((product) => product.id)).toEqual(["price-10", "price-40"])
  })

  it("orders the complete set by descending price", () => {
    const products = [
      candidate("price-20", 5, 20),
      candidate("price-80", 5, 80),
      candidate("price-50", 5, 50),
    ]

    expect(combinedOrder(products, "desc").map((product) => product.id)).toEqual([
      "price-80",
      "price-50",
      "price-20",
    ])
  })

  it("keeps inventory status primary when available and sold-out prices interleave", () => {
    const products = [
      candidate("available-300", 5, 300),
      candidate("sold-1", 0, 1),
      candidate("available-100", 5, 100),
      candidate("sold-200", 0, 200),
    ]

    expect(combinedOrder(products, "asc").map((product) => product.id)).toEqual([
      "available-100",
      "available-300",
      "sold-1",
      "sold-200",
    ])
  })

  it("preserves original order for equal prices", () => {
    const products = [
      candidate("equal-1", 5, 20),
      candidate("equal-2", 5, 20),
      candidate("equal-3", 5, 20),
    ]

    expect(combinedOrder(products, "asc").map((product) => product.id)).toEqual([
      "equal-1",
      "equal-2",
      "equal-3",
    ])
  })

  it("treats missing and invalid prices as zero and keeps them stable", () => {
    const invalid = candidate("invalid", 5, Number.NaN)
    const products = [
      candidate("missing-1", 5),
      candidate("price-10", 5, 10),
      invalid,
      candidate("missing-2", 5),
    ]

    expect(combinedOrder(products, "asc").map((product) => product.id)).toEqual([
      "missing-1",
      "invalid",
      "missing-2",
      "price-10",
    ])
  })

  it("keeps original candidate order when no price sorter is supplied", async () => {
    const products = [candidate("price-50", 5, 50), candidate("price-10", 5, 10)]
    const result = await loadPrioritizedProductSelection({
      fetchCandidateBatch: async () => ({ products, count: products.length }),
      fetchProductsByIds: async (ids) => ids.map((id) => ({ id })),
      limit: 2,
      batchSize: 2,
    })

    expect(result.products.map((product) => product.id)).toEqual(["price-50", "price-10"])
  })
})
