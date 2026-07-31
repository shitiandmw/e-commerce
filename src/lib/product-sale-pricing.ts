import type {
  IPricingModuleService,
  MedusaContainer,
  PriceListDTO,
} from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  batchPriceListPricesWorkflow,
  createPriceListsWorkflow,
  deletePriceListsWorkflow,
  updatePriceListsWorkflow,
} from "@medusajs/medusa/core-flows"

export const MANAGED_PRODUCT_SALE_PREFIX = "managed-product-sale:"

export type ProductSaleMode = "ongoing" | "scheduled"
export type ProductSaleStatus =
  | "not_configured"
  | "disabled"
  | "scheduled"
  | "active"
  | "ended"

export type ProductSalePriceInput = {
  variant_id: string
  enabled: boolean
  mode: ProductSaleMode
  amount: number | null
  currency_code: string
  starts_at: string | null
  ends_at: string | null
}

export type ProductSalePrice = ProductSalePriceInput & {
  status: ProductSaleStatus
}

export type PublicProductSalePrice = Pick<
  ProductSalePrice,
  | "variant_id"
  | "amount"
  | "currency_code"
  | "starts_at"
  | "ends_at"
  | "status"
>

type ProductVariantPrice = {
  amount: number
  currency_code: string
}

type ProductVariant = {
  id: string
  title: string
  prices?: ProductVariantPrice[]
}

type ProductSnapshot = {
  id: string
  variants?: ProductVariant[]
}

type ManagedPriceList = PriceListDTO & {
  prices?: Array<{
    id: string
    amount: number
    currency_code: string
  }>
}

export function buildManagedProductSaleMarker(
  productId: string,
  variantId: string
) {
  return `${MANAGED_PRODUCT_SALE_PREFIX}${productId}:${variantId}`
}

export function parseManagedProductSaleMarker(description?: string | null) {
  if (!description?.startsWith(MANAGED_PRODUCT_SALE_PREFIX)) return null
  const parts = description.slice(MANAGED_PRODUCT_SALE_PREFIX.length).split(":")
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return { product_id: parts[0], variant_id: parts[1] }
}

export function resolveProductSaleStatus(
  priceList?: Pick<PriceListDTO, "status" | "starts_at" | "ends_at"> | null,
  now = new Date()
): ProductSaleStatus {
  if (!priceList) return "not_configured"
  if (priceList.status !== "active") return "disabled"

  const timestamp = now.getTime()
  if (
    priceList.starts_at &&
    timestamp < new Date(priceList.starts_at).getTime()
  ) {
    return "scheduled"
  }
  if (
    priceList.ends_at &&
    timestamp >= new Date(priceList.ends_at).getTime()
  ) {
    return "ended"
  }
  return "active"
}

function salePricingError(message: string) {
  return new MedusaError(
    MedusaError.Types.INVALID_DATA,
    message,
    "PRODUCT_SALE_PRICING_INVALID"
  )
}

export function validateProductSalePricingInput(
  productId: string,
  configurations: ProductSalePriceInput[],
  variants: ProductVariant[]
) {
  const variantById = new Map(variants.map((variant) => [variant.id, variant]))
  const seen = new Set<string>()

  for (const configuration of configurations) {
    if (seen.has(configuration.variant_id)) {
      throw salePricingError(`规格 ${configuration.variant_id} 的优惠价配置重复`)
    }
    seen.add(configuration.variant_id)

    const variant = variantById.get(configuration.variant_id)
    if (!variant) {
      throw salePricingError(
        `规格 ${configuration.variant_id} 不属于商品 ${productId}`
      )
    }

    if (configuration.enabled && configuration.amount === null) {
      throw salePricingError(`规格“${variant.title}”开启优惠价后必须填写优惠价`)
    }
    if (configuration.amount === null) continue

    const currencyCode = configuration.currency_code.trim().toLowerCase()
    const basePrice = (variant.prices || []).find(
      (price) => price.currency_code.toLowerCase() === currencyCode
    )
    if (!basePrice) {
      throw salePricingError(
        `规格“${variant.title}”没有 ${currencyCode.toUpperCase()} 原价`
      )
    }
    if (configuration.amount <= 0) {
      throw salePricingError(`规格“${variant.title}”的优惠价必须大于 0`)
    }
    if (configuration.amount >= basePrice.amount) {
      throw salePricingError(`规格“${variant.title}”的优惠价必须低于原价`)
    }

    if (configuration.mode === "scheduled") {
      if (!configuration.starts_at || !configuration.ends_at) {
        throw salePricingError(
          `规格“${variant.title}”的定时优惠必须填写开始和结束时间`
        )
      }
      if (
        new Date(configuration.ends_at).getTime() <=
        new Date(configuration.starts_at).getTime()
      ) {
        throw salePricingError(
          `规格“${variant.title}”的优惠结束时间必须晚于开始时间`
        )
      }
    }
  }

  for (const variant of variants) {
    if (!seen.has(variant.id)) {
      throw salePricingError(`缺少规格“${variant.title}”的优惠价配置`)
    }
  }
}

function toIso(value?: string | null) {
  return value ? new Date(value).toISOString() : null
}

export async function getProductSnapshot(
  container: MedusaContainer,
  productId: string
) {
  const query = container.resolve("query") as any
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "variants.id",
      "variants.title",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: { id: productId },
  })
  const product = data?.[0] as ProductSnapshot | undefined
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product ${productId} was not found`
    )
  }
  return product
}

export async function listManagedProductSalePriceLists(
  container: MedusaContainer,
  productId: string
) {
  const pricing = container.resolve(Modules.PRICING) as IPricingModuleService
  const prefix = `${MANAGED_PRODUCT_SALE_PREFIX}${productId}:`
  const priceLists = await pricing.listPriceLists(
    { q: prefix },
    { relations: ["prices"], take: 1000 }
  )
  return (priceLists as ManagedPriceList[]).filter((priceList) =>
    priceList.description?.startsWith(prefix)
  )
}

export async function getProductSalePrices(
  container: MedusaContainer,
  productId: string,
  now = new Date()
): Promise<ProductSalePrice[]> {
  const [product, priceLists] = await Promise.all([
    getProductSnapshot(container, productId),
    listManagedProductSalePriceLists(container, productId),
  ])
  const priceListByVariant = new Map<string, ManagedPriceList>()
  for (const priceList of priceLists) {
    const marker = parseManagedProductSaleMarker(priceList.description)
    if (marker && !priceListByVariant.has(marker.variant_id)) {
      priceListByVariant.set(marker.variant_id, priceList)
    }
  }

  return (product.variants || []).map((variant) => {
    const priceList = priceListByVariant.get(variant.id)
    const price = priceList?.prices?.[0]
    const basePrice = variant.prices?.[0]
    return {
      variant_id: variant.id,
      enabled: priceList?.status === "active",
      mode:
        priceList?.starts_at || priceList?.ends_at ? "scheduled" : "ongoing",
      amount: price?.amount ?? null,
      currency_code:
        price?.currency_code || basePrice?.currency_code || "usd",
      starts_at: toIso(priceList?.starts_at),
      ends_at: toIso(priceList?.ends_at),
      status: resolveProductSaleStatus(priceList, now),
    }
  })
}

export function getPublicProductSalePrices(
  salePrices: ProductSalePrice[]
): PublicProductSalePrice[] {
  return salePrices
    .filter((salePrice) =>
      salePrice.enabled &&
      salePrice.amount !== null &&
      (salePrice.status === "active" || salePrice.status === "scheduled")
    )
    .map((salePrice) => ({
      variant_id: salePrice.variant_id,
      amount: salePrice.amount,
      currency_code: salePrice.currency_code,
      starts_at: salePrice.starts_at,
      ends_at: salePrice.ends_at,
      status: salePrice.status,
    }))
}

export async function getStoreProductSalePrices(
  container: MedusaContainer,
  productId: string,
  now = new Date()
) {
  const salePrices = await getProductSalePrices(container, productId, now)
  return getPublicProductSalePrices(salePrices)
}

export async function syncProductSalePrices(
  container: MedusaContainer,
  productId: string,
  configurations: ProductSalePriceInput[]
) {
  const [product, existingPriceLists] = await Promise.all([
    getProductSnapshot(container, productId),
    listManagedProductSalePriceLists(container, productId),
  ])
  const variants = product.variants || []
  validateProductSalePricingInput(productId, configurations, variants)

  const existingByVariant = new Map<string, ManagedPriceList>()
  const duplicateIds: string[] = []
  for (const priceList of existingPriceLists) {
    const marker = parseManagedProductSaleMarker(priceList.description)
    if (!marker) continue
    if (existingByVariant.has(marker.variant_id)) {
      duplicateIds.push(priceList.id)
    } else {
      existingByVariant.set(marker.variant_id, priceList)
    }
  }

  const configuredVariantIds = new Set(
    configurations.map((configuration) => configuration.variant_id)
  )
  const deleteIds = [
    ...duplicateIds,
    ...Array.from(existingByVariant.entries())
      .filter(([variantId]) => !configuredVariantIds.has(variantId))
      .map(([, priceList]) => priceList.id),
  ]
  const creates: any[] = []
  const updates: any[] = []
  const priceUpdates: Array<{
    priceList: ManagedPriceList
    configuration: ProductSalePriceInput
  }> = []

  for (const configuration of configurations) {
    const existing = existingByVariant.get(configuration.variant_id)
    if (configuration.amount === null) {
      if (existing) deleteIds.push(existing.id)
      continue
    }

    const variant = variants.find((item) => item.id === configuration.variant_id)!
    const description = buildManagedProductSaleMarker(
      productId,
      configuration.variant_id
    )
    const common = {
      title: `${variant.title} 优惠价`,
      description,
      type: "sale",
      status: configuration.enabled ? "active" : "draft",
      starts_at:
        configuration.mode === "scheduled" ? configuration.starts_at : null,
      ends_at:
        configuration.mode === "scheduled" ? configuration.ends_at : null,
    }

    if (existing) {
      updates.push({ id: existing.id, ...common })
      priceUpdates.push({ priceList: existing, configuration })
    } else {
      creates.push({
        ...common,
        prices: [{
          amount: configuration.amount,
          currency_code: configuration.currency_code,
          variant_id: configuration.variant_id,
        }],
      })
    }
  }

  if (deleteIds.length > 0) {
    await deletePriceListsWorkflow(container).run({
      input: { ids: Array.from(new Set(deleteIds)) },
    })
  }
  if (updates.length > 0) {
    await updatePriceListsWorkflow(container).run({
      input: { price_lists_data: updates },
    })
  }
  for (const { priceList, configuration } of priceUpdates) {
    const [currentPrice, ...extraPrices] = priceList.prices || []
    await batchPriceListPricesWorkflow(container).run({
      input: {
        data: {
          id: priceList.id,
          create: currentPrice
            ? []
            : [{
                amount: configuration.amount!,
                currency_code: configuration.currency_code,
                variant_id: configuration.variant_id,
              }],
          update: currentPrice
            ? [{
                id: currentPrice.id,
                amount: configuration.amount!,
                currency_code: configuration.currency_code,
                variant_id: configuration.variant_id,
              }]
            : [],
          delete: extraPrices.map((price) => price.id),
        },
      },
    })
  }
  if (creates.length > 0) {
    await createPriceListsWorkflow(container).run({
      input: { price_lists_data: creates },
    })
  }

  return getProductSalePrices(container, productId)
}

export async function deleteManagedProductSalePrices(
  container: MedusaContainer,
  productId: string
) {
  const priceLists = await listManagedProductSalePriceLists(container, productId)
  if (priceLists.length === 0) return
  await deletePriceListsWorkflow(container).run({
    input: { ids: priceLists.map((priceList) => priceList.id) },
  })
}
