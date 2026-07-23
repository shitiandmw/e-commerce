import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { RESTOCK_DEMAND_MODULE } from "../modules/restock-demand"

export const VARIANT_SALES_DISABLED_KEY = "sales_disabled"
export const VARIANT_SALES_DISABLED_AT_KEY = "sales_disabled_at"
export const VARIANT_SALES_DISABLED_BY_KEY = "sales_disabled_by"

export const PRODUCT_VARIANT_DELETE_ERROR_CODES = {
  HAS_INVENTORY: "PRODUCT_VARIANT_DELETE_HAS_INVENTORY",
  HAS_ORDERS: "PRODUCT_VARIANT_DELETE_HAS_ORDERS",
  HAS_RESTOCK_DEMAND: "PRODUCT_VARIANT_DELETE_HAS_RESTOCK_DEMAND",
} as const

export type VariantConfigurationOptionValueInput = {
  key: string
  id?: string
  value: string
}

export type VariantConfigurationOptionInput = {
  key: string
  id?: string
  title: string
  values: VariantConfigurationOptionValueInput[]
}

export type VariantConfigurationVariantInput = {
  key: string
  id?: string
  title: string
  sku: string
  prices: Array<{ amount: number; currency_code: string }>
  manage_inventory: boolean
  option_values: Record<string, string>
  status: "active" | "stopped" | "delete"
}

export type SyncProductVariantConfigurationInput = {
  product_id: string
  expected_updated_at?: string
  actor_id?: string
  options: VariantConfigurationOptionInput[]
  variants: VariantConfigurationVariantInput[]
}

export type PreparedProductVariantConfiguration = {
  product_id: string
  desired_options: Array<{
    id?: string
    title: string
    values: string[]
  }>
  delete_option_ids: string[]
  create_variants: Array<{
    product_id: string
    title: string
    sku: string
    prices: Array<{ amount: number; currency_code: string }>
    manage_inventory: boolean
    options: Record<string, string>
    metadata: Record<string, unknown>
  }>
  update_variants: Array<{
    id: string
    title: string
    sku: string
    prices: Array<{ amount: number; currency_code: string }>
    manage_inventory: boolean
    options: Record<string, string>
    metadata: Record<string, unknown>
  }>
  delete_variant_ids: string[]
  stopped_variant_ids: string[]
}

type ExistingVariant = {
  id: string
  title: string
  sku?: string | null
  metadata?: Record<string, unknown> | null
  inventory_quantity?: number | null
  inventory_items?: Array<{
    inventory?: {
      location_levels?: Array<{
        stocked_quantity?: number | null
        reserved_quantity?: number | null
        incoming_quantity?: number | null
      }>
    } | null
  }>
}

type ExistingProduct = {
  id: string
  updated_at?: string | Date | null
  options?: Array<{
    id: string
    title: string
    values?: Array<{ id: string; value: string }>
  }>
  variants?: ExistingVariant[]
}

function configurationError(
  message: string,
  code = "PRODUCT_VARIANT_CONFIGURATION_INVALID",
  details: Record<string, unknown> = {}
) {
  const error = new MedusaError(MedusaError.Types.INVALID_DATA, message, code)
  Object.assign(error, {
    code,
    product_variant_configuration_code: code,
    details,
    status: 400,
    ...details,
  })
  return error
}

export function sendProductVariantConfigurationError(
  res: any,
  error: unknown
) {
  const code = (error as any)?.product_variant_configuration_code
  if (!code) return false

  const details = (error as any)?.details || {}
  res.status((error as any).status || 400).json({
    code,
    type: (error as any)?.type || MedusaError.Types.INVALID_DATA,
    message:
      typeof (error as any)?.message === "string"
        ? (error as any).message
        : "Product variant configuration validation failed",
    ...details,
  })
  return true
}

function normalize(value: string) {
  return value.trim()
}

function normalizedIdentity(value: string) {
  return normalize(value).toLocaleLowerCase()
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>()
  for (const value of values) {
    const identity = normalizedIdentity(value)
    if (!identity) throw configurationError(`${label}不能为空`)
    if (seen.has(identity)) throw configurationError(`${label}“${value}”重复`)
    seen.add(identity)
  }
}

export function isVariantSalesDisabled(metadata?: Record<string, unknown> | null) {
  return metadata?.[VARIANT_SALES_DISABLED_KEY] === true
}

export function validateVariantConfigurationShape(
  input: SyncProductVariantConfigurationInput
) {
  if (input.options.length === 0) {
    throw configurationError("商品至少需要一个选项；单规格商品使用系统默认选项")
  }

  assertUnique(input.options.map((option) => option.key), "选项标识")
  assertUnique(input.options.map((option) => option.title), "选项名称")

  const optionByKey = new Map(input.options.map((option) => [option.key, option]))
  const valuesByOption = new Map<string, Map<string, VariantConfigurationOptionValueInput>>()

  for (const option of input.options) {
    if (option.values.length === 0) {
      throw configurationError(`选项“${option.title}”至少需要一个值`)
    }
    assertUnique(option.values.map((value) => value.key), `${option.title}选项值标识`)
    assertUnique(option.values.map((value) => value.value), `${option.title}选项值`)
    valuesByOption.set(
      option.key,
      new Map(option.values.map((value) => [value.key, value]))
    )
  }

  const retainedVariants = input.variants.filter((variant) => variant.status !== "delete")
  if (retainedVariants.length === 0) {
    throw configurationError("商品至少需要保留一个规格")
  }

  assertUnique(retainedVariants.map((variant) => variant.key), "规格标识")
  assertUnique(retainedVariants.map((variant) => variant.sku), "SKU")

  const combinations = new Set<string>()
  for (const variant of retainedVariants) {
    const selectedOptionKeys = Object.keys(variant.option_values)
    if (
      selectedOptionKeys.length !== input.options.length ||
      selectedOptionKeys.some((key) => !optionByKey.has(key))
    ) {
      throw configurationError(`规格“${variant.title}”必须为每个选项选择一个值`)
    }

    const combinationParts = input.options.map((option) => {
      const valueKey = variant.option_values[option.key]
      const value = valuesByOption.get(option.key)?.get(valueKey)
      if (!value) {
        throw configurationError(
          `规格“${variant.title}”使用了不存在的“${option.title}”选项值`
        )
      }
      return `${option.key}:${value.key}`
    })
    const signature = combinationParts.sort().join("|")
    if (combinations.has(signature)) {
      throw configurationError(`规格“${variant.title}”的选项组合重复`)
    }
    combinations.add(signature)
  }

  return { optionByKey, valuesByOption }
}

function hasInventory(variant: ExistingVariant) {
  if ((variant.inventory_quantity ?? 0) > 0) return true
  return (variant.inventory_items || []).some((link) =>
    (link.inventory?.location_levels || []).some(
      (level) =>
        (level.stocked_quantity ?? 0) > 0 ||
        (level.reserved_quantity ?? 0) > 0 ||
        (level.incoming_quantity ?? 0) > 0
    )
  )
}

async function assertVariantCanBePermanentlyDeleted(
  container: MedusaContainer,
  variant: ExistingVariant
) {
  if (hasInventory(variant)) {
    throw configurationError(
      `SKU ${variant.sku || variant.title} 仍有库存、预留或在途数量，只能停售`,
      PRODUCT_VARIANT_DELETE_ERROR_CODES.HAS_INVENTORY,
      { variant_id: variant.id, sku: variant.sku || null }
    )
  }

  const orderService = container.resolve(Modules.ORDER) as any
  const orderItems = await orderService.listOrderLineItems(
    { variant_id: variant.id },
    { take: 1 }
  )
  if (orderItems.length > 0) {
    throw configurationError(
      `SKU ${variant.sku || variant.title} 已产生订单，只能停售`,
      PRODUCT_VARIANT_DELETE_ERROR_CODES.HAS_ORDERS,
      { variant_id: variant.id, sku: variant.sku || null }
    )
  }

  const restockService = container.resolve(RESTOCK_DEMAND_MODULE) as any
  const restockRounds = await restockService.listRestockRounds({
    variant_id: variant.id,
  })
  if (restockRounds.length > 0) {
    throw configurationError(
      `SKU ${variant.sku || variant.title} 已产生补货需求，只能停售`,
      PRODUCT_VARIANT_DELETE_ERROR_CODES.HAS_RESTOCK_DEMAND,
      { variant_id: variant.id, sku: variant.sku || null }
    )
  }
}

export async function prepareProductVariantConfiguration(
  container: MedusaContainer,
  input: SyncProductVariantConfigurationInput
): Promise<PreparedProductVariantConfiguration> {
  const { optionByKey, valuesByOption } = validateVariantConfigurationShape(input)
  const query = container.resolve("query") as any
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "updated_at",
      "options.id",
      "options.title",
      "options.values.id",
      "options.values.value",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.metadata",
      "variants.inventory_quantity",
      "variants.inventory_items.inventory.location_levels.stocked_quantity",
      "variants.inventory_items.inventory.location_levels.reserved_quantity",
      "variants.inventory_items.inventory.location_levels.incoming_quantity",
    ],
    filters: { id: input.product_id },
  })
  const product = data?.[0] as ExistingProduct | undefined
  if (!product) throw configurationError("商品不存在", "PRODUCT_NOT_FOUND")

  if (input.expected_updated_at && product.updated_at) {
    const expected = new Date(input.expected_updated_at).getTime()
    const actual = new Date(product.updated_at).getTime()
    if (expected !== actual) {
      throw configurationError(
        "商品已被其他操作更新，请刷新后重试",
        "PRODUCT_VARIANT_CONFIGURATION_CONFLICT"
      )
    }
  }

  const existingOptions = new Map((product.options || []).map((option) => [option.id, option]))
  const submittedOptionIds = new Set(input.options.map((option) => option.id).filter(Boolean))
  for (const option of input.options) {
    if (option.id && !existingOptions.has(option.id)) {
      throw configurationError(`选项 ${option.id} 不属于当前商品`)
    }
  }

  const existingVariants = new Map((product.variants || []).map((variant) => [variant.id, variant]))
  const submittedExistingIds = new Set(input.variants.map((variant) => variant.id).filter(Boolean))
  for (const variant of input.variants) {
    if (variant.id && !existingVariants.has(variant.id)) {
      throw configurationError(`规格 ${variant.id} 不属于当前商品`)
    }
  }
  for (const variantId of existingVariants.keys()) {
    if (!submittedExistingIds.has(variantId)) {
      throw configurationError(`已有规格 ${variantId} 必须明确选择保留、停售或永久删除`)
    }
  }

  const deleteVariantIds = input.variants
    .filter((variant) => variant.status === "delete" && variant.id)
    .map((variant) => variant.id as string)
  for (const variantId of deleteVariantIds) {
    await assertVariantCanBePermanentlyDeleted(container, existingVariants.get(variantId)!)
  }

  const now = new Date().toISOString()
  const createVariants: PreparedProductVariantConfiguration["create_variants"] = []
  const updateVariants: PreparedProductVariantConfiguration["update_variants"] = []
  const stoppedVariantIds: string[] = []

  for (const variant of input.variants) {
    if (variant.status === "delete") continue
    const options = Object.fromEntries(
      input.options.map((option) => {
        const selected = valuesByOption.get(option.key)!.get(variant.option_values[option.key])!
        return [optionByKey.get(option.key)!.title.trim(), selected.value.trim()]
      })
    )
    const existing = variant.id ? existingVariants.get(variant.id) : undefined
    const metadata = { ...(existing?.metadata || {}) }
    if (variant.status === "stopped") {
      metadata[VARIANT_SALES_DISABLED_KEY] = true
      metadata[VARIANT_SALES_DISABLED_AT_KEY] =
        metadata[VARIANT_SALES_DISABLED_AT_KEY] || now
      metadata[VARIANT_SALES_DISABLED_BY_KEY] = input.actor_id || null
      if (variant.id) stoppedVariantIds.push(variant.id)
    } else {
      delete metadata[VARIANT_SALES_DISABLED_KEY]
      delete metadata[VARIANT_SALES_DISABLED_AT_KEY]
      delete metadata[VARIANT_SALES_DISABLED_BY_KEY]
    }

    const common = {
      title: normalize(variant.title),
      sku: normalize(variant.sku),
      prices: variant.prices,
      manage_inventory: variant.manage_inventory,
      options,
      metadata,
    }
    if (variant.id) updateVariants.push({ id: variant.id, ...common })
    else createVariants.push({ product_id: input.product_id, ...common })
  }

  return {
    product_id: input.product_id,
    desired_options: input.options.map((option) => ({
      id: option.id,
      title: normalize(option.title),
      values: option.values.map((value) => normalize(value.value)),
    })),
    delete_option_ids: [...existingOptions.keys()].filter((id) => !submittedOptionIds.has(id)),
    create_variants: createVariants,
    update_variants: updateVariants,
    delete_variant_ids: deleteVariantIds,
    stopped_variant_ids: stoppedVariantIds,
  }
}

export async function assertVariantIsSellable(
  container: MedusaContainer,
  variantId: string
) {
  const query = container.resolve("query") as any
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id", "metadata"],
    filters: { id: variantId },
  })
  const variant = data?.[0] as { id: string; metadata?: Record<string, unknown> | null } | undefined
  if (!variant) throw configurationError("商品规格不存在", "PRODUCT_VARIANT_NOT_FOUND")
  if (isVariantSalesDisabled(variant.metadata)) {
    throw configurationError("该商品规格已停售", "PRODUCT_VARIANT_STOPPED")
  }
}

export async function assertCartVariantsAreSellable(
  container: MedusaContainer,
  cartId: string
) {
  const query = container.resolve("query") as any
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "items.variant_id", "items.variant.metadata"],
    filters: { id: cartId },
  })
  const cart = data?.[0] as any
  const stopped = (cart?.items || []).filter((item: any) =>
    isVariantSalesDisabled(item.variant?.metadata)
  )
  if (stopped.length > 0) {
    throw configurationError(
      "购物车中包含已停售规格，请移除后重试",
      "CART_CONTAINS_STOPPED_VARIANT"
    )
  }
}
