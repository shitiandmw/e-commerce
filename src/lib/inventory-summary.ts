export const LOW_STOCK_THRESHOLD = 10
export const OUT_OF_STOCK_THRESHOLD = 0

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

export interface InventorySummaryLevel {
  available_quantity?: number | null
}

export interface InventorySummaryItem {
  stocked_quantity?: number | null
  reserved_quantity?: number | null
  location_levels?: InventorySummaryLevel[] | null
}

export interface InventoryStats {
  total: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export const INVENTORY_SUMMARY_REQUIRED_FIELDS = [
  "stocked_quantity",
  "reserved_quantity",
  "location_levels.available_quantity",
]

export function withInventorySummaryFields(fields: string[] = []): string[] {
  return Array.from(new Set([...fields, ...INVENTORY_SUMMARY_REQUIRED_FIELDS]))
}

export function getInventoryItemAvailable(item: InventorySummaryItem): number {
  if (!item.location_levels || item.location_levels.length === 0) {
    return (item.stocked_quantity ?? 0) - (item.reserved_quantity ?? 0)
  }

  return item.location_levels.reduce(
    (sum, level) => sum + (level.available_quantity || 0),
    0
  )
}

export function getInventoryItemStockStatus(
  item: InventorySummaryItem
): StockStatus {
  const totalAvailable = getInventoryItemAvailable(item)
  if (totalAvailable <= OUT_OF_STOCK_THRESHOLD) return "out_of_stock"
  if (totalAvailable <= LOW_STOCK_THRESHOLD) return "low_stock"
  return "in_stock"
}

export function summarizeInventoryItems(
  items: InventorySummaryItem[]
): InventoryStats {
  return items.reduce(
    (summary, item) => {
      const status = getInventoryItemStockStatus(item)
      summary.total += 1
      if (status === "in_stock") summary.inStock += 1
      if (status === "low_stock") summary.lowStock += 1
      if (status === "out_of_stock") summary.outOfStock += 1
      return summary
    },
    { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
  )
}
