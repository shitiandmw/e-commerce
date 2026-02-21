import { fetchContent, sdk } from "@/lib/medusa"

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
}

/* ---------- Fetchers ---------- */

/**
 * Fetch a single curated collection by key.
 */
export async function fetchCollection(key: string): Promise<CuratedCollection | null> {
  try {
    const data = await fetchContent<CollectionsResponse>("/store/content/collections", { key })
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
): Promise<Map<string, { price: number; currency_code: string }>> {
  const priceMap = new Map<string, { price: number; currency_code: string }>()
  if (productIds.length === 0) return priceMap

  try {
    const data = await fetchContent<StoreProductsResponse>(
      "/store/products",
      { id: productIds.join(","), fields: "id,variants.prices" },
    )
    for (const product of data?.products ?? []) {
      const cheapest = product.variants
        ?.flatMap((v) => v.prices ?? [])
        .sort((a, b) => a.amount - b.amount)[0]
      if (cheapest) {
        priceMap.set(product.id, {
          price: cheapest.amount,
          currency_code: cheapest.currency_code,
        })
      }
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
): Promise<CollectionProductWithPrice[]> {
  const collection = await fetchCollection(key)
  if (!collection) return []

  const productIds = collection.items
    .map((item) => item.product_id)
    .filter(Boolean)

  const priceMap = await fetchProductPrices(productIds)

  return collection.items
    .filter((item) => item.product !== null)
    .map((item) => {
      const priceInfo = priceMap.get(item.product_id)
      return {
        id: item.product!.id,
        title: item.product!.title,
        handle: item.product!.handle,
        thumbnail: item.product!.thumbnail,
        price: priceInfo?.price ?? null,
        currency_code: priceInfo?.currency_code ?? "hkd",
      }
    })
}
