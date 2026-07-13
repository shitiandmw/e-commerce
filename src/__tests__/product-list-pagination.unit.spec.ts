import {
  collectAllProductCandidates,
  loadPrioritizedProductSelection,
} from "../../storefront-v2/lib/product-availability"

type Candidate = {
  id: string
  variants: Array<{ inventory_quantity: number }>
}

const soldOut = (id: string): Candidate => ({
  id,
  variants: [{ inventory_quantity: 0 }],
})

const available = (id: string): Candidate => ({
  id,
  variants: [{ inventory_quantity: 1 }],
})

describe("complete product candidate pagination", () => {
  it("prioritizes across batches before taking the requested page", async () => {
    const fetchCandidateBatch = jest.fn(async ({ offset }: { limit: number; offset: number }) => {
      if (offset === 0) return { products: [soldOut("sold-1"), soldOut("sold-2")], count: 3 }
      if (offset === 2) return { products: [available("available-3")], count: 3 }
      return { products: [], count: 3 }
    })
    const fetchProductsByIds = jest.fn(async (ids: string[]) => (
      [...ids].reverse().map((id) => ({ id, title: id }))
    ))

    const result = await loadPrioritizedProductSelection({
      fetchCandidateBatch,
      fetchProductsByIds,
      limit: 2,
      batchSize: 2,
    })

    expect(fetchCandidateBatch).toHaveBeenCalledTimes(2)
    expect(fetchCandidateBatch).toHaveBeenNthCalledWith(1, { limit: 2, offset: 0 })
    expect(fetchCandidateBatch).toHaveBeenNthCalledWith(2, { limit: 2, offset: 2 })
    expect(fetchProductsByIds).toHaveBeenCalledWith(["available-3", "sold-1"])
    expect(result.products.map((product) => product.id)).toEqual(["available-3", "sold-1"])
    expect(result).toMatchObject({ count: 3, offset: 0, limit: 2 })
  })

  it("stops when an API repeats a page despite an abnormal count", async () => {
    const repeated = [soldOut("sold-1"), available("available-2")]
    const fetchCandidateBatch = jest.fn().mockResolvedValue({
      products: repeated,
      count: 999999,
    })

    const result = await collectAllProductCandidates(fetchCandidateBatch, {
      batchSize: 2,
      maxBatches: 10,
    })

    expect(fetchCandidateBatch).toHaveBeenCalledTimes(2)
    expect(result.map((product) => product.id)).toEqual(["sold-1", "available-2"])
  })

  it("stops on an empty page even when the reported count claims more products", async () => {
    const fetchCandidateBatch = jest.fn()
      .mockResolvedValueOnce({ products: [soldOut("sold-1")], count: 500 })
      .mockResolvedValueOnce({ products: [], count: 500 })

    const result = await collectAllProductCandidates(fetchCandidateBatch, { batchSize: 1 })

    expect(fetchCandidateBatch).toHaveBeenCalledTimes(2)
    expect(result.map((product) => product.id)).toEqual(["sold-1"])
  })
})
