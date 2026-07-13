import type { MedusaProduct } from "./products"
import {
  loadPrioritizedProductSelection,
  type InventoryProductCandidate,
  type ProductBatch,
} from "../product-availability"

const CART_RECOMMENDATION_LIMIT = 4
const CART_RECOMMENDATION_FIELDS =
  "id,title,handle,thumbnail,*variants,*variants.prices,*variants.inventory_quantity,*variants.manage_inventory,*brand"
const PRODUCT_INVENTORY_CANDIDATE_FIELDS =
  "id,*variants.inventory_quantity,*variants.manage_inventory"

async function requestProducts<T>(
  params: URLSearchParams,
  request: typeof fetch,
): Promise<T> {
  const response = await request(`/api/products?${params.toString()}`)
  if (!response.ok) throw new Error(`Product API error: ${response.status}`)
  return response.json()
}

export async function fetchCartRecommendedProducts(
  locale: string,
  request: typeof fetch = fetch,
): Promise<MedusaProduct[]> {
  const selection = await loadPrioritizedProductSelection({
    fetchCandidateBatch: ({ limit, offset }) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        order: "-created_at",
        fields: PRODUCT_INVENTORY_CANDIDATE_FIELDS,
        locale,
      })
      return requestProducts<ProductBatch<InventoryProductCandidate>>(params, request)
    },
    fetchProductsByIds: (ids) => {
      const params = new URLSearchParams({
        limit: String(ids.length),
        fields: CART_RECOMMENDATION_FIELDS,
        locale,
      })
      ids.forEach((id) => params.append("id[]", id))
      return requestProducts<{ products?: MedusaProduct[] }>(params, request)
        .then((data) => data.products ?? [])
    },
    limit: CART_RECOMMENDATION_LIMIT,
  })

  return selection.products
}
