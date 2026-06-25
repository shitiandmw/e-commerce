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
  product_links?: InventoryProductLink[]
  reserved_quantity?: number
  stocked_quantity?: number
  created_at: string
  updated_at: string
}

export interface InventoryProductLink {
  inventory_item_id: string
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  variant_sku?: string | null
  manage_inventory?: boolean
}

interface ProductVariantInventoryLink {
  inventory_item_id?: string | null
  required_quantity?: number
  inventory?: InventoryItem | null
}

interface ProductVariantInventorySnapshot {
  id: string
  title: string
  sku?: string | null
  manage_inventory?: boolean
  inventory_items?: ProductVariantInventoryLink[]
}

interface ProductInventorySnapshot {
  id: string
  title: string
  variants?: ProductVariantInventorySnapshot[]
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

export interface InventoryStats {
  total: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export interface InventoryItemsSummaryResponse {
  inventory_items: InventoryItem[]
  count: number
  stats: InventoryStats
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

const INVENTORY_ITEMS_FIELDS = "*location_levels"
const PRODUCT_INVENTORY_FIELDS =
  "id,title,+variants,+variants.inventory_items,+variants.inventory_items.inventory,+variants.inventory_items.inventory.location_levels"
const PRODUCT_INVENTORY_LINK_FIELDS =
  "id,title,+variants,+variants.inventory_items"

function buildInventoryItemsPath(params: InventoryQueryParams = {}) {
  const {
    offset = 0,
    limit = 20,
    q,
    sku,
    order,
    fields = INVENTORY_ITEMS_FIELDS,
    location_id,
  } = params

  const queryParams = new URLSearchParams()
  queryParams.set("offset", String(offset))
  queryParams.set("limit", String(limit))
  queryParams.set("fields", fields)
  if (q) queryParams.set("q", q)
  if (sku) queryParams.set("sku", sku)
  if (order) queryParams.set("order", order)
  if (location_id) queryParams.set("location_levels[location_id]", location_id)

  return `/admin/inventory-items?${queryParams.toString()}`
}

export function fetchInventoryItems(params: InventoryQueryParams = {}) {
  return adminFetch<InventoryItemsResponse>(buildInventoryItemsPath(params))
}

export function fetchStockLocations() {
  return adminFetch<StockLocationsResponse>("/admin/stock-locations", {
    params: { limit: "100", offset: "0" },
  })
}

export function fetchProductInventorySnapshot(productId: string) {
  return adminFetch<{ product: ProductInventorySnapshot }>(
    `/admin/products/${productId}?fields=${PRODUCT_INVENTORY_FIELDS}`
  )
}

export async function fetchInventoryProductLinks(): Promise<InventoryProductLink[]> {
  const links: InventoryProductLink[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const data = await adminFetch<{
      products: ProductInventorySnapshot[]
      count: number
    }>(
      `/admin/products?offset=${offset}&limit=${limit}&fields=${PRODUCT_INVENTORY_LINK_FIELDS}`
    )

    for (const product of data.products || []) {
      for (const variant of product.variants || []) {
        for (const itemLink of variant.inventory_items || []) {
          const inventoryItemId =
            itemLink.inventory_item_id || itemLink.inventory?.id
          if (!inventoryItemId) continue

          links.push({
            inventory_item_id: inventoryItemId,
            product_id: product.id,
            product_title: product.title,
            variant_id: variant.id,
            variant_title: variant.title,
            variant_sku: variant.sku,
            manage_inventory: variant.manage_inventory,
          })
        }
      }
    }

    offset += limit
    if (offset >= (data.count || 0)) break
  }

  return links
}

export function useInventoryItems(params: InventoryQueryParams = {}) {
  const {
    offset = 0,
    limit = 20,
    q,
    sku,
    order,
    fields = INVENTORY_ITEMS_FIELDS,
    location_id,
  } = params

  return useQuery<InventoryItemsResponse>({
    queryKey: [
      "inventory-items",
      { offset, limit, q, sku, order, fields, location_id },
    ],
    queryFn: () =>
      fetchInventoryItems({ offset, limit, q, sku, order, fields, location_id }),
  })
}

export function useInventoryProductLinks(enabled = true) {
  return useQuery<InventoryProductLink[]>({
    queryKey: ["inventory-product-links"],
    queryFn: fetchInventoryProductLinks,
    enabled,
  })
}

export function useInventoryItemsSummary(
  params: Omit<InventoryQueryParams, "offset" | "limit"> = {}
) {
  const { q, sku, order, fields = INVENTORY_ITEMS_FIELDS, location_id } = params

  return useQuery<InventoryItemsSummaryResponse>({
    queryKey: ["inventory-items", "summary", { q, sku, order, fields, location_id }],
    queryFn: () => {
      const queryParams = new URLSearchParams()
      queryParams.set("fields", fields)
      if (q) queryParams.set("q", q)
      if (sku) queryParams.set("sku", sku)
      if (order) queryParams.set("order", order)
      if (location_id) queryParams.set("location_levels[location_id]", location_id)

      return adminFetch<InventoryItemsSummaryResponse>(
        `/admin/inventory-summary?${queryParams.toString()}`
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
    queryFn: fetchStockLocations,
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
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })
}

export function useCreateInventoryLevel(inventoryItemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      location_id: string
      stocked_quantity: number
      incoming_quantity?: number
    }) =>
      adminFetch(
        `/admin/inventory-items/${inventoryItemId}/location-levels`,
        { method: "POST", body: data }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-item", inventoryItemId] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product"] })
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

/**
 * Create an inventory item for a variant, associate it with the variant and
 * the default stock location.
 *
 * Medusa v2 only auto-creates inventory items when a variant is first created
 * with manage_inventory=true. Toggling the flag on an existing variant does
 * NOT back-fill the item, so we do it here.
 */
export async function ensureInventoryForVariant(opts: {
  variantId: string
  productId: string
  sku?: string | null
  title?: string | null
  productTitle?: string | null
  locationId?: string
  stockedQuantity?: number
  syncStockedQuantity?: boolean
}) {
  const snapshot = await fetchProductInventorySnapshot(opts.productId)
  const variant = snapshot.product.variants?.find((v) => v.id === opts.variantId)
  const existingLink = variant?.inventory_items?.[0]
  const desiredTitle = buildInventoryItemTitle(
    opts.productTitle || snapshot.product.title,
    opts.title || variant?.title
  )
  const desiredMetadata = {
    product_id: opts.productId,
    product_title: opts.productTitle || snapshot.product.title,
    variant_id: opts.variantId,
    variant_title: opts.title || variant?.title || null,
  }

  if (existingLink) {
    const inventoryItemId =
      existingLink.inventory_item_id || existingLink.inventory?.id
    if (!inventoryItemId) {
      throw new Error("Variant inventory link is missing inventory_item_id")
    }

    const item = await fetchInventoryItem(inventoryItemId)
    await syncInventoryItemMetadata(item, {
      sku: opts.sku ?? variant?.sku,
      title: desiredTitle,
      metadata: desiredMetadata,
      variantTitle: variant?.title,
    })
    await ensureInventoryLevel(item, {
      locationId: opts.locationId,
      stockedQuantity: opts.stockedQuantity,
      syncStockedQuantity: opts.syncStockedQuantity,
    })

    return item
  }

  const reusableItem = opts.sku
    ? await findInventoryItemBySku(opts.sku)
    : undefined

  if (reusableItem) {
    await syncInventoryItemMetadata(reusableItem, {
      sku: opts.sku ?? variant?.sku,
      title: desiredTitle,
      metadata: desiredMetadata,
      variantTitle: variant?.title,
    })
    await ensureInventoryLevel(reusableItem, {
      locationId: opts.locationId,
      stockedQuantity: opts.stockedQuantity,
      syncStockedQuantity: opts.syncStockedQuantity,
    })
    await linkInventoryItemToVariant({
      productId: opts.productId,
      variantId: opts.variantId,
      inventoryItemId: reusableItem.id,
    })

    return reusableItem
  }

  const item = await adminFetch<{ inventory_item: InventoryItem }>(
    "/admin/inventory-items",
    {
      method: "POST",
      body: {
        sku: opts.sku ?? undefined,
        title: desiredTitle,
        metadata: desiredMetadata,
        location_levels: opts.locationId
          ? [
              {
                location_id: opts.locationId,
                stocked_quantity: opts.stockedQuantity ?? 0,
              },
            ]
          : undefined,
      },
    }
  )

  const inventoryItemId = item.inventory_item.id

  await linkInventoryItemToVariant({
    productId: opts.productId,
    variantId: opts.variantId,
    inventoryItemId,
  })

  return item.inventory_item
}

export function useBulkEnableInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (locationId: string) => {
      let offset = 0
      const limit = 100
      let enabled = 0

      while (true) {
        const data = await adminFetch<{
          products: Array<{
            id: string
            title: string
            variants?: Array<{
              id: string
              title: string
              sku?: string | null
              manage_inventory?: boolean
            }>
          }>
          count: number
        }>(
          `/admin/products?offset=${offset}&limit=${limit}&fields=id,title,+variants`
        )

        for (const product of data.products) {
          if (!product.variants) continue
          for (const variant of product.variants) {
            if (variant.manage_inventory !== false) continue

            await adminFetch(
              `/admin/products/${product.id}/variants/${variant.id}`,
              { method: "POST", body: { manage_inventory: true } }
            )

            await ensureInventoryForVariant({
              variantId: variant.id,
              productId: product.id,
              sku: variant.sku,
              title: variant.title,
              productTitle: product.title,
              locationId,
            })

            enabled++
          }
        }

        offset += limit
        if (offset >= data.count) break
      }

      return { enabled }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-product-links"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
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

export function buildInventoryProductLinkMap(
  links: InventoryProductLink[] = []
): Map<string, InventoryProductLink[]> {
  const map = new Map<string, InventoryProductLink[]>()
  for (const link of links) {
    const existing = map.get(link.inventory_item_id) || []
    existing.push(link)
    map.set(link.inventory_item_id, existing)
  }
  return map
}

export function withInventoryProductLinks(
  items: InventoryItem[] = [],
  linksByInventoryItemId: Map<string, InventoryProductLink[]>
): InventoryItem[] {
  return items.map((item) => ({
    ...item,
    product_links: linksByInventoryItemId.get(item.id) || item.product_links || [],
  }))
}

export function inventoryItemMatchesSearch(
  item: InventoryItem,
  search: string
): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true

  const values = [
    item.sku,
    item.title,
    item.description,
    ...(item.product_links || []).flatMap((link) => [
      link.product_title,
      link.variant_title,
      link.variant_sku,
    ]),
  ]

  return values.some((value) => value?.toLowerCase().includes(query))
}

function buildInventoryItemTitle(
  productTitle?: string | null,
  variantTitle?: string | null
) {
  const product = productTitle?.trim()
  const variant = variantTitle?.trim()

  if (!product) return variant || undefined
  if (!variant || variant.toLowerCase() === "default") return product
  return `${product} - ${variant}`
}

async function fetchInventoryItem(inventoryItemId: string) {
  const data = await adminFetch<{ inventory_item: InventoryItem }>(
    `/admin/inventory-items/${inventoryItemId}?fields=*location_levels`
  )
  return data.inventory_item
}

async function findInventoryItemBySku(sku: string) {
  const data = await fetchInventoryItems({
    sku,
    limit: 1,
    fields: "*location_levels",
  })
  return data.inventory_items?.[0]
}

async function linkInventoryItemToVariant({
  productId,
  variantId,
  inventoryItemId,
}: {
  productId: string
  variantId: string
  inventoryItemId: string
}) {
  await adminFetch(`/admin/products/${productId}/variants/inventory-items/batch`, {
    method: "POST",
    body: {
      create: [
        {
          inventory_item_id: inventoryItemId,
          variant_id: variantId,
          required_quantity: 1,
        },
      ],
    },
  })
}

async function ensureInventoryLevel(
  item: InventoryItem,
  opts: {
    locationId?: string
    stockedQuantity?: number
    syncStockedQuantity?: boolean
  }
) {
  if (!opts.locationId) return

  const existingLevel = item.location_levels?.find(
    (level) => level.location_id === opts.locationId
  )
  const stockedQuantity = opts.stockedQuantity ?? 0

  if (!existingLevel) {
    await adminFetch(`/admin/inventory-items/${item.id}/location-levels`, {
      method: "POST",
      body: {
        location_id: opts.locationId,
        stocked_quantity: stockedQuantity,
      },
    })
    return
  }

  if (
    opts.syncStockedQuantity &&
    opts.stockedQuantity !== undefined &&
    existingLevel.stocked_quantity !== opts.stockedQuantity
  ) {
    await adminFetch(
      `/admin/inventory-items/${item.id}/location-levels/${opts.locationId}`,
      {
        method: "POST",
        body: { stocked_quantity: opts.stockedQuantity },
      }
    )
  }
}

async function syncInventoryItemMetadata(
  item: InventoryItem,
  opts: {
    sku?: string | null
    title?: string
    metadata: Record<string, unknown>
    variantTitle?: string | null
  }
) {
  const body: Record<string, unknown> = {}
  const currentTitle = item.title?.trim()
  const variantTitle = opts.variantTitle?.trim()

  if (
    opts.title &&
    (!currentTitle ||
      currentTitle.toLowerCase() === "default" ||
      (!!variantTitle && currentTitle === variantTitle))
  ) {
    body.title = opts.title
  }

  if (opts.sku && item.sku !== opts.sku) {
    body.sku = opts.sku
  }

  body.metadata = {
    ...(item.metadata || {}),
    ...opts.metadata,
  }

  if (Object.keys(body).length === 0) return

  await adminFetch(`/admin/inventory-items/${item.id}`, {
    method: "POST",
    body,
  })
}
