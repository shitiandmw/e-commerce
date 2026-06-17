import {
  INVENTORY_SUMMARY_REQUIRED_FIELDS,
  getInventoryItemStockStatus,
  summarizeInventoryItems,
  withInventorySummaryFields,
} from "../lib/inventory-summary"
import { GET as getInventorySummary } from "../api/admin/inventory-summary/route"

describe("inventory summary", () => {
  it("classifies inventory items by total available quantity", () => {
    expect(
      getInventoryItemStockStatus({
        location_levels: [{ available_quantity: 11 }],
      })
    ).toBe("in_stock")

    expect(
      getInventoryItemStockStatus({
        location_levels: [{ available_quantity: 10 }],
      })
    ).toBe("low_stock")

    expect(
      getInventoryItemStockStatus({
        location_levels: [{ available_quantity: 0 }],
      })
    ).toBe("out_of_stock")
  })

  it("summarizes all items, not just a page-sized subset", () => {
    const items = [
      { location_levels: [{ available_quantity: 20 }] },
      { location_levels: [{ available_quantity: 1 }] },
      { location_levels: [{ available_quantity: 0 }] },
      { stocked_quantity: 7, reserved_quantity: 2 },
    ]

    expect(summarizeInventoryItems(items)).toEqual({
      total: 4,
      inStock: 1,
      lowStock: 2,
      outOfStock: 1,
    })
  })

  it("adds required inventory fields when callers request a trimmed field set", () => {
    expect(withInventorySummaryFields(["id", "sku", "title"])).toEqual([
      "id",
      "sku",
      "title",
      ...INVENTORY_SUMMARY_REQUIRED_FIELDS,
    ])
  })

  it("computes stats with required inventory fields even when request fields are trimmed", async () => {
    const statsRows = [
      { id: "item_1", sku: "SKU-1", location_levels: [{ available_quantity: 12 }] },
      { id: "item_2", sku: "SKU-2", location_levels: [{ available_quantity: 0 }] },
    ]
    const responseRows = [
      { id: "item_1", sku: "SKU-1", title: "Item 1" },
      { id: "item_2", sku: "SKU-2", title: "Item 2" },
    ]
    const remoteQuery = jest
      .fn()
      .mockResolvedValueOnce({
        rows: statsRows,
        metadata: { count: 2 },
      })
      .mockResolvedValueOnce({
        rows: responseRows,
        metadata: { count: 2 },
      })
    const json = jest.fn()
    const status = jest.fn(() => ({ json }))

    await getInventorySummary(
      {
        scope: {
          resolve: jest.fn(() => remoteQuery),
        },
        filterableFields: {},
        queryConfig: {
          fields: ["id", "sku", "title"],
          pagination: {},
        },
      } as any,
      { status } as any
    )

    const statsQuery = remoteQuery.mock.calls[0][0].__value.inventory_items
    const responseQuery = remoteQuery.mock.calls[1][0].__value.inventory_items

    expect(statsQuery.fields).toEqual(
      expect.arrayContaining([
        "id",
        "sku",
        "title",
        "stocked_quantity",
        "reserved_quantity",
      ])
    )
    expect(statsQuery.location_levels.fields).toContain("available_quantity")
    expect(responseQuery.fields).toEqual(["id", "sku", "title"])
    expect(responseQuery.location_levels).toBeUndefined()
    expect(json).toHaveBeenCalledWith({
      inventory_items: responseRows,
      count: 2,
      stats: {
        total: 2,
        inStock: 1,
        lowStock: 0,
        outOfStock: 1,
      },
    })
  })
})
