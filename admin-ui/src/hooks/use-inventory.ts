"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"

// ---- Types ----

export interface InventoryLevel {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity: number
  available_quantity: number
  incoming_quantity: number
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface InventoryItem {
  id: string
  sku: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
  requires_shipping: boolean
  origin_country: string | null
  hs_code: string | null
  mid_code: string | null
  material: string | null
  weight: number | null
  length: number | null
  height: number | null
  width: number | null
  metadata?: Record<string, unknown> | null
  location_levels?: InventoryLevel[]
  reserved_quantity?: number
  stocked_quantity?: number
  created_at: string
  updated_at: string
}

export interface StockLocation {
  id: string
  name: string
  address?: {
    id: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
  } | null
  created_at: string
  updated_at: string
}

export interface InventoryItemsResponse {
  inventory_items: InventoryItem[]
  count: number
  offset: number
  limit: number
}

export interface StockLocationsResponse {
  stock_locations: StockLocation[]
  count: number
  offset: number
  limit: number
}

export interface InventoryQueryParams {
  offset?: number
  limit?: number
  q?: string
  sku?: string
  order?: string
  fields?: string
  location_id?: string
}

// ---- Hooks ----

export function useInventoryItems(params: InventoryQueryParams = {}) {
  const { offset = 0, limit = 20, q, sku, order, location_id } = params

  return useQuery<InventoryItemsResponse>({
    queryKey: ["inventory-items", { offset, limit, q, sku, order, location_id }],
    queryFn: () => {
      const queryParams = new URLSearchParams()
      queryParams.set("offset", String(offset))
      queryParams.set("limit", String(limit))
      queryParams.set("fields", "*location_levels")
      if (q) queryParams.set("q", q)
      if (sku) queryParams.set("sku", sku)
      if (order) queryParams.set("order", order)
      if (location_id) queryParams.set("location_levels[location_id]", location_id)
      return adminFetch<InventoryItemsResponse>(
        `/admin/inventory-items?${queryParams.toString()}`
      )
    },
  })
}

export function useInventoryItem(id: string) {
  return useQuery<{ inventory_item: InventoryItem }>({
    queryKey: ["inventory-item", id],
    queryFn: () =>
      adminFetch<{ inventory_item: InventoryItem }>(
        `/admin/inventory-items/${id}?fields=*location_levels`
      ),
    enabled: !!id,
  })
}

export function useStockLocations() {
  return useQuery<StockLocationsResponse>({
    queryKey: ["stock-locations"],
    queryFn: () =>
      adminFetch<StockLocationsResponse>("/admin/stock-locations", {
        params: { limit: "100", offset: "0" },
      }),
  })
}

export function useUpdateInventoryLevel(inventoryItemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      locationId,
      stocked_quantity,
      incoming_quantity,
    }: {
      locationId: string
      stocked_quantity?: number
      incoming_quantity?: number
    }) => {
      const body: Record<string, number> = {}
      if (stocked_quantity !== undefined) body.stocked_quantity = stocked_quantity
      if (incoming_quantity !== undefined) body.incoming_quantity = incoming_quantity
      return adminFetch(
        `/admin/inventory-items/${inventoryItemId}/location-levels/${locationId}`,
        {
          method: "POST",
          body,
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-item", inventoryItemId] })
    },
  })
}

export function useUpdateInventoryItem(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch(`/admin/inventory-items/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-item", id] })
    },
  })
}

// ---- Helpers ----

/** Low stock threshold - items with available quantity below this are flagged */
export const LOW_STOCK_THRESHOLD = 10

/** Out of stock threshold */
export const OUT_OF_STOCK_THRESHOLD = 0

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

export function getStockStatus(item: InventoryItem): StockStatus {
  const totalAvailable = getTotalAvailable(item)
  if (totalAvailable <= OUT_OF_STOCK_THRESHOLD) return "out_of_stock"
  if (totalAvailable <= LOW_STOCK_THRESHOLD) return "low_stock"
  return "in_stock"
}

export function getTotalStocked(item: InventoryItem): number {
  if (!item.location_levels || item.location_levels.length === 0) {
    return item.stocked_quantity ?? 0
  }
  return item.location_levels.reduce(
    (sum, level) => sum + (level.stocked_quantity || 0),
    0
  )
}

export function getTotalReserved(item: InventoryItem): number {
  if (!item.location_levels || item.location_levels.length === 0) {
    return item.reserved_quantity ?? 0
  }
  return item.location_levels.reduce(
    (sum, level) => sum + (level.reserved_quantity || 0),
    0
  )
}

export function getTotalAvailable(item: InventoryItem): number {
  if (!item.location_levels || item.location_levels.length === 0) {
    return (item.stocked_quantity ?? 0) - (item.reserved_quantity ?? 0)
  }
  return item.location_levels.reduce(
    (sum, level) => sum + (level.available_quantity || 0),
    0
  )
}

export function getTotalIncoming(item: InventoryItem): number {
  if (!item.location_levels || item.location_levels.length === 0) return 0
  return item.location_levels.reduce(
    (sum, level) => sum + (level.incoming_quantity || 0),
    0
  )
}
