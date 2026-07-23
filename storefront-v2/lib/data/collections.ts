import { fetchContent } from "@/lib/medusa"
import {
  getSellableVariants,
  isProductOutOfStock,
  prioritizeInStockItems,
} from "@/lib/product-availability"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/* ---------- Types ---------- */

export interface CollectionProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

export interface CollectionItem {
  id: string
  product_id: string
  tab_id: string | null
  sort_order: number
  product: CollectionProduct | null
}

export interface CollectionTab {
  id: string
  name: string
  key: string
  sort_order: number
}

export interface CuratedCollection {
  id: string
  name: string
  key: string
  description: string | null
  sort_order: number
  tabs: CollectionTab[]
  items: CollectionItem[]
}

interface CollectionsResponse {
  collections: CuratedCollection[]
}

/* ---------- Product price types ---------- */

interface ProductPrice {
  amount: number
  currency_code: string
}

interface ProductVariant {
  id: string
  prices: ProductPrice[]
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  metadata?: Record<string, unknown> | null
}

interface StoreProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variants: ProductVariant[]
}

interface StoreProductsResponse {
  products: StoreProduct[]
}

/* ---------- Merged type for components ---------- */

export interface CollectionProductWithPrice {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  price: number | null
  currency_code: string
  isOutOfStock: boolean
}

interface CollectionProductData {
  price: number | null
  currency_code: string
  isOutOfStock: boolean
}

/* ---------- Fetchers ---------- */

/**
 * Fetch a single curated collection by key.
 */
export async function fetchCollection(key: string, locale?: string): Promise<CuratedCollection | null> {
  try {
    const data = await fetchContent<CollectionsResponse>("/store/content/collections", { key }, locale)
    return data?.collections?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Fetch product prices from Medusa Store API.
 * Returns a map of product_id -> { price, currency_code }.
 */
export async function fetchProductPrices(
  productIds: string[],
  locale?: string,
): Promise<Map<string, CollectionProductData>> {
  const priceMap = new Map<string, CollectionProductData>()
  if (productIds.length === 0) return priceMap

  try {
    const url = new URL(`${MEDUSA_BACKEND_URL}/store/products`)
    for (const id of productIds) {
      url.searchParams.append("id[]", id)
    }
    url.searchParams.set(
      "fields",
      "id,*variants.prices,*variants.inventory_quantity,*variants.manage_inventory,*variants.metadata",
    )

    const headers: Record<string, string> = {}
    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY
    }
    if (locale) {
      headers["x-medusa-locale"] = locale
    }

    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 30 },
    })
    if (!res.ok) return priceMap

    const data: StoreProductsResponse = await res.json()
    for (const product of data?.products ?? []) {
      const sellableVariants = getSellableVariants(product.variants)
      const cheapest = sellableVariants
        .flatMap((v) => v.prices ?? [])
        .filter((p) => p.currency_code === "usd")
        .sort((a, b) => a.amount - b.amount)[0]
        || sellableVariants
          .flatMap((v) => v.prices ?? [])
          .sort((a, b) => a.amount - b.amount)[0]
      priceMap.set(product.id, {
        price: cheapest?.amount ?? null,
        currency_code: cheapest?.currency_code ?? "usd",
        isOutOfStock: isProductOutOfStock(product),
      })
    }
  } catch {
    // Price fetch failed — components will show without price
  }

  return priceMap
}

/**
 * Fetch a collection and enrich items with product prices.
 * Returns products ready for component consumption.
 */
export async function fetchCollectionWithPrices(
  key: string,
  locale?: string,
): Promise<CollectionProductWithPrice[]> {
  const collection = await fetchCollection(key, locale)
  if (!collection) return []

  const productIds = collection.items
    .map((item) => item.product_id)
    .filter(Boolean)

  const priceMap = await fetchProductPrices(productIds, locale)

  const products = collection.items
    .filter((item) => item.product !== null)
    .map((item) => {
      const priceInfo = priceMap.get(item.product_id)
      return {
        id: item.product!.id,
        title: item.product!.title,
        handle: item.product!.handle,
        thumbnail: item.product!.thumbnail,
        price: priceInfo?.price ?? null,
        currency_code: priceInfo?.currency_code ?? "usd",
        isOutOfStock: priceInfo?.isOutOfStock ?? false,
      }
    })

  return prioritizeInStockItems(products, (product) => product.isOutOfStock)
}
