export interface InventoryVariant {
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  metadata?: Record<string, unknown> | null
}

export interface InventoryAwareProduct {
  variants?: readonly InventoryVariant[] | null
}

export interface VariantOptionValue {
  id: string
  option_id: string
}

export interface OptionLinkedVariant extends InventoryVariant {
  options?: readonly VariantOptionValue[] | null
}

export interface InventoryProductCandidate extends InventoryAwareProduct {
  id: string
}

export interface ProductBatch<T> {
  products?: T[] | null
  count?: number | null
}

export interface ProductSelection<T> {
  products: T[]
  count: number
  offset: number
  limit: number
}

interface LoadProductSelectionOptions<Candidate extends InventoryProductCandidate, Product extends { id: string }> {
  fetchCandidateBatch: (params: { limit: number; offset: number }) => Promise<ProductBatch<Candidate>>
  fetchProductsByIds: (ids: string[]) => Promise<Product[]>
  limit: number
  offset?: number
  excludeIds?: readonly string[]
  batchSize?: number
  maxBatches?: number
  sortCandidates?: (candidates: readonly Candidate[]) => Candidate[]
  filterCandidates?: (candidate: Candidate) => boolean
}

interface SelectProductOptions<Candidate extends InventoryProductCandidate, Product extends { id: string }> {
  candidates: readonly Candidate[]
  fetchProductsByIds: (ids: string[]) => Promise<Product[]>
  limit: number
  offset?: number
  excludeIds?: readonly string[]
  sortCandidates?: (candidates: readonly Candidate[]) => Candidate[]
  filterCandidates?: (candidate: Candidate) => boolean
}

export const PRODUCT_CANDIDATE_BATCH_SIZE = 100
export const MAX_PRODUCT_CANDIDATE_BATCHES = 1000
export const VARIANT_SALES_DISABLED_KEY = "sales_disabled"

export function isVariantSalesDisabled(
  variant: Pick<InventoryVariant, "metadata"> | null | undefined,
): boolean {
  const value = variant?.metadata?.[VARIANT_SALES_DISABLED_KEY]
  return value === true || value === "true"
}

export function getSellableVariants<T extends Pick<InventoryVariant, "metadata">>(
  variants: readonly T[] | null | undefined,
): T[] {
  return variants?.filter((variant) => !isVariantSalesDisabled(variant)) ?? []
}

export function findSellableVariantByOptionValueIds<T extends OptionLinkedVariant>(
  variants: readonly T[] | null | undefined,
  optionIds: readonly string[],
  selectedOptionValueIds: Readonly<Record<string, string>>,
): T | undefined {
  if (!optionIds.every((optionId) => selectedOptionValueIds[optionId])) {
    return undefined
  }

  return getSellableVariants(variants).find((variant) =>
    variant.options?.length === optionIds.length
    && optionIds.every((optionId) =>
      variant.options?.some(
        (value) => value.option_id === optionId
          && value.id === selectedOptionValueIds[optionId],
      ),
    ),
  )
}

export function isOptionValueCombinationAvailable<T extends OptionLinkedVariant>(
  variants: readonly T[] | null | undefined,
  selectedOptionValueIds: Readonly<Record<string, string>>,
): boolean {
  return getSellableVariants(variants).some((variant) =>
    Object.entries(selectedOptionValueIds).every(([optionId, optionValueId]) =>
      variant.options?.some(
        (value) => value.option_id === optionId && value.id === optionValueId,
      ),
    ),
  )
}

/**
 * A product is only known to be out of stock when every variant uses inventory
 * management and has a known, non-positive inventory quantity.
 */
export function isProductOutOfStock(product: InventoryAwareProduct): boolean {
  if (!product.variants?.length) return false

  const variants = getSellableVariants(product.variants)
  return variants.length === 0 || variants.every(isVariantOutOfStock)
}

export function isVariantOutOfStock(variant: InventoryVariant | null | undefined): boolean {
  if (isVariantSalesDisabled(variant)) return true
  if (!variant || variant.manage_inventory === false) return false

  const quantity = variant.inventory_quantity
  return typeof quantity === "number" && Number.isFinite(quantity) && quantity <= 0
}

/** Stable partition: available/unknown items first, definitely out-of-stock items last. */
export function prioritizeInStockItems<T>(
  items: readonly T[],
  isOutOfStock: (item: T) => boolean,
): T[] {
  const availableOrUnknown: T[] = []
  const outOfStock: T[] = []

  for (const item of items) {
    if (isOutOfStock(item)) {
      outOfStock.push(item)
    } else {
      availableOrUnknown.push(item)
    }
  }

  return availableOrUnknown.concat(outOfStock)
}

export function prioritizeInStockProducts<T extends InventoryAwareProduct>(
  products: readonly T[],
): T[] {
  return prioritizeInStockItems(products, (product) => isProductOutOfStock(product))
}

/**
 * Collect the complete lightweight candidate set before inventory grouping.
 * Empty/repeated pages and a hard batch cap prevent bad API metadata from
 * causing an infinite loop.
 */
export async function collectAllProductCandidates<T extends InventoryProductCandidate>(
  fetchBatch: (params: { limit: number; offset: number }) => Promise<ProductBatch<T>>,
  options: { batchSize?: number; maxBatches?: number } = {},
): Promise<T[]> {
  const batchSize = Math.max(1, Math.floor(options.batchSize ?? PRODUCT_CANDIDATE_BATCH_SIZE))
  const maxBatches = Math.max(1, Math.floor(options.maxBatches ?? MAX_PRODUCT_CANDIDATE_BATCHES))
  const products: T[] = []
  const seenIds = new Set<string>()
  let offset = 0

  for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
    const data = await fetchBatch({ limit: batchSize, offset })
    const batch = Array.isArray(data.products) ? data.products : []
    if (batch.length === 0) break

    let added = 0
    for (const product of batch) {
      if (!product?.id || seenIds.has(product.id)) continue
      seenIds.add(product.id)
      products.push(product)
      added += 1
    }

    if (added === 0) break

    offset += batch.length
    const reportedCount = data.count
    const hasUsableCount = typeof reportedCount === "number"
      && Number.isFinite(reportedCount)
      && reportedCount >= offset

    if (hasUsableCount && offset >= reportedCount) break
    if (!hasUsableCount && batch.length < batchSize) break
  }

  return products
}

export async function loadPrioritizedProductSelection<
  Candidate extends InventoryProductCandidate,
  Product extends { id: string },
>({
  fetchCandidateBatch,
  fetchProductsByIds,
  limit,
  offset = 0,
  excludeIds = [],
  batchSize,
  maxBatches,
  sortCandidates,
  filterCandidates,
}: LoadProductSelectionOptions<Candidate, Product>): Promise<ProductSelection<Product>> {
  const candidates = await collectAllProductCandidates(fetchCandidateBatch, {
    batchSize,
    maxBatches,
  })

  return selectPrioritizedProductSelection({
    candidates,
    fetchProductsByIds,
    limit,
    offset,
    excludeIds,
    sortCandidates,
    filterCandidates,
  })
}

export async function selectPrioritizedProductSelection<
  Candidate extends InventoryProductCandidate,
  Product extends { id: string },
>({
  candidates,
  fetchProductsByIds,
  limit,
  offset = 0,
  excludeIds = [],
  sortCandidates,
  filterCandidates,
}: SelectProductOptions<Candidate, Product>): Promise<ProductSelection<Product>> {
  const safeLimit = Math.max(0, Math.floor(limit))
  const safeOffset = Math.max(0, Math.floor(offset))
  const excluded = new Set(excludeIds)
  const filteredCandidates = candidates.filter((product) =>
    !excluded.has(product.id) && (!filterCandidates || filterCandidates(product))
  )

  const sortedCandidates = sortCandidates
    ? sortCandidates(filteredCandidates)
    : filteredCandidates
  const prioritized = prioritizeInStockProducts(sortedCandidates)
  const selectedIds = prioritized
    .slice(safeOffset, safeOffset + safeLimit)
    .map((product) => product.id)

  if (selectedIds.length === 0) {
    return { products: [], count: filteredCandidates.length, offset: safeOffset, limit: safeLimit }
  }

  const details = await fetchProductsByIds(selectedIds)
  const detailsById = new Map(details.map((product) => [product.id, product]))
  const products = selectedIds
    .map((id) => detailsById.get(id))
    .filter((product): product is Product => product !== undefined)

  return { products, count: filteredCandidates.length, offset: safeOffset, limit: safeLimit }
}
