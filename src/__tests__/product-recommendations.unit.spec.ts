import { fetchCartRecommendedProducts } from "../../storefront-v2/lib/data/cart-recommendations"
import {
  fetchProducts,
  fetchRelatedProducts,
  type MedusaProduct,
} from "../../storefront-v2/lib/data/products"

function candidate(id: string, inventoryQuantity: number, amount?: number) {
  return {
    id,
    variants: [{
      inventory_quantity: inventoryQuantity,
      prices: amount === undefined ? [] : [{ amount, currency_code: "usd" }],
    }],
  }
}

function product(id: string, inventoryQuantity = 0): MedusaProduct {
  return {
    id,
    title: id,
    handle: id,
    subtitle: null,
    description: null,
    thumbnail: null,
    images: [],
    options: [],
    variants: [{
      id: `variant_${id}`,
      title: id,
      sku: null,
      prices: [],
      inventory_quantity: inventoryQuantity,
    }],
    collection_id: null,
    metadata: null,
    custom_tags: [],
  }
}

function response(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response
}

function errorResponse(status = 500): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: "fixture error" }),
  } as Response
}

describe("product recommendation candidate truncation", () => {
  it("moves a second-batch available result onto the first category/search page", async () => {
    const originalFetch = global.fetch
    const firstBatch = Array.from({ length: 100 }, (_, index) => candidate(`sold-${index + 1}`, 0))
    const request = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const fields = url.searchParams.get("fields")
      if (fields === "id") {
        const offset = Number(url.searchParams.get("offset") ?? 0)
        const products = offset === 0 ? firstBatch : [candidate("available-101", 2)]
        return response({ products, count: 101, offset, limit: 100 })
      }
      if (fields === "id,*variants.inventory_quantity,*variants.manage_inventory") {
        const ids = url.searchParams.getAll("id[]")
        const products = ids.map((id) => (
          id === "available-101" ? candidate(id, 2) : candidate(id, 0)
        ))
        return response({
          products,
          count: products.length,
          offset: 0,
          limit: products.length,
        })
      }

      const ids = url.searchParams.getAll("id[]")
      return response({ products: ids.map((id) => product(id, id === "available-101" ? 2 : 0)) })
    })
    global.fetch = request as typeof fetch

    try {
      const result = await fetchProducts({
        category_id: "category_1",
        q: "cigar",
        limit: 2,
        offset: 0,
        locale: "zh-TW",
        region_id: "region_1",
      })

      expect(result.products.map((item) => item.id)).toEqual(["available-101", "sold-1"])
      expect(result).toMatchObject({ count: 101, offset: 0, limit: 2 })
      const secondBatchUrl = new URL(String(request.mock.calls[1][0]))
      expect(secondBatchUrl.searchParams.get("offset")).toBe("100")
      expect(secondBatchUrl.searchParams.get("q")).toBe("cigar")
      expect(secondBatchUrl.searchParams.get("category_id[]")).toBe("category_1")
      const inventoryUrl = new URL(String(request.mock.calls[2][0]))
      expect(inventoryUrl.searchParams.get("fields")).toBe(
        "id,*variants.inventory_quantity,*variants.manage_inventory",
      )
      expect(inventoryUrl.searchParams.has("category_id[]")).toBe(false)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("uses price fields from every category batch before ascending pagination", async () => {
    const originalFetch = global.fetch
    const firstBatch = Array.from(
      { length: 100 },
      (_, index) => candidate(`product-${index + 1}`, 5),
    )
    const lastProduct = candidate("product-101", 5)
    const priceFields = [
      "id",
      "*variants.inventory_quantity",
      "*variants.manage_inventory",
      "*variants.calculated_price",
      "*variants.prices",
    ].join(",")
    const request = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const fields = url.searchParams.get("fields")
      if (fields === "id") {
        const offset = Number(url.searchParams.get("offset") ?? 0)
        return response({
          products: offset === 0 ? firstBatch : [lastProduct],
          count: 101,
          offset,
          limit: 100,
        })
      }
      if (fields === priceFields) {
        const ids = url.searchParams.getAll("id[]")
        return response({
          products: ids.map((id) => candidate(
            id,
            5,
            id === "product-101" ? 1 : Number(id.slice("product-".length)) + 100,
          )),
          count: ids.length,
          offset: 0,
          limit: ids.length,
        })
      }

      const ids = url.searchParams.getAll("id[]")
      return response({ products: ids.map((id) => product(id, 5)) })
    })
    global.fetch = request as typeof fetch

    try {
      const result = await fetchProducts({
        category_id: "category_1",
        limit: 2,
        offset: 0,
        locale: "zh-TW",
        region_id: "region_1",
        price_order: "asc",
      })

      expect(result.products.map((item) => item.id)).toEqual(["product-101", "product-1"])
      expect(result).toMatchObject({ count: 101, offset: 0, limit: 2 })
      expect(new URL(String(request.mock.calls[2][0])).searchParams.get("fields")).toBe(priceFields)
      expect(new URL(String(request.mock.calls[3][0])).searchParams.get("fields")).toBe(priceFields)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("falls back to original order when any price candidate batch fails", async () => {
    const originalFetch = global.fetch
    const firstBatch = Array.from(
      { length: 100 },
      (_, index) => candidate(`product-${index + 1}`, 5, index + 100),
    )
    const priceFields = [
      "id",
      "*variants.inventory_quantity",
      "*variants.manage_inventory",
      "*variants.calculated_price",
      "*variants.prices",
    ].join(",")
    const request = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const fields = url.searchParams.get("fields")
      const offset = Number(url.searchParams.get("offset") ?? 0)
      if (fields === priceFields) {
        if (offset === 100) return errorResponse()
        return response({ products: firstBatch, count: 101, offset: 0, limit: 100 })
      }
      if (fields === "id,*variants.inventory_quantity,*variants.manage_inventory") {
        return response({ products: [candidate("product-101", 5)], count: 101, offset: 100, limit: 100 })
      }

      const ids = url.searchParams.getAll("id[]")
      return response({ products: ids.map((id) => product(id, 5)) })
    })
    global.fetch = request as typeof fetch

    try {
      const result = await fetchProducts({
        q: "cigar",
        limit: 2,
        offset: 0,
        locale: "zh-TW",
        region_id: "region_1",
        price_order: "asc",
      })

      expect(result.products.map((item) => item.id)).toEqual(["product-1", "product-2"])
      expect(request).toHaveBeenCalledTimes(4)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("selects an available related product beyond the original four-item cutoff", async () => {
    const originalFetch = global.fetch
    const candidates = [
      candidate("current", 1),
      candidate("sold-1", 0),
      candidate("sold-2", 0),
      candidate("sold-3", 0),
      candidate("sold-4", 0),
      candidate("available-5", 2),
    ]
    const request = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const fields = url.searchParams.get("fields")
      if (fields === "id") {
        return response({ products: candidates, count: candidates.length, offset: 0, limit: 100 })
      }
      if (fields === "id,*variants.inventory_quantity,*variants.manage_inventory") {
        const ids = url.searchParams.getAll("id[]")
        const products = ids
          .map((id) => candidates.find((item) => item.id === id))
          .filter((item) => item !== undefined)
        return response({ products, count: products.length, offset: 0, limit: products.length })
      }

      const ids = url.searchParams.getAll("id[]")
      return response({ products: [...ids].reverse().map((id) => product(id, id === "available-5" ? 2 : 0)) })
    })
    global.fetch = request as typeof fetch

    try {
      const result = await fetchRelatedProducts({
        ...product("current", 1),
        categories: [{ id: "category_1", name: "Category", handle: "category" }],
      }, 4, "zh-TW", "region_1")

      expect(result.map((item) => item.id)).toEqual([
        "available-5",
        "sold-1",
        "sold-2",
        "sold-3",
      ])
      expect(request).toHaveBeenCalledTimes(3)
      const inventoryUrl = new URL(String(request.mock.calls[1][0]))
      expect(inventoryUrl.searchParams.has("category_id")).toBe(false)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("selects an available cart recommendation after four sold-out candidates", async () => {
    const candidates = [
      candidate("sold-1", 0),
      candidate("sold-2", 0),
      candidate("sold-3", 0),
      candidate("sold-4", 0),
      candidate("available-5", 3),
    ]
    const request = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input), "http://localhost")
      const fields = url.searchParams.get("fields")
      if (fields === "id,*variants.inventory_quantity,*variants.manage_inventory") {
        return response({ products: candidates, count: candidates.length, offset: 0, limit: 100 })
      }

      const ids = url.searchParams.getAll("id[]")
      return response({ products: [...ids].reverse().map((id) => product(id, id === "available-5" ? 3 : 0)) })
    })

    const result = await fetchCartRecommendedProducts("zh-TW", request as typeof fetch)

    expect(result.map((item) => item.id)).toEqual([
      "available-5",
      "sold-1",
      "sold-2",
      "sold-3",
    ])
    expect(request).toHaveBeenCalledTimes(2)
    const detailUrl = new URL(String(request.mock.calls[1][0]), "http://localhost")
    expect(detailUrl.searchParams.getAll("id[]")).toEqual([
      "available-5",
      "sold-1",
      "sold-2",
      "sold-3",
    ])
  })
})
