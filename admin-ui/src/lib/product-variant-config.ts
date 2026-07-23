import type { Product } from "@/hooks/use-products"
import { toSlug } from "./slug"

export type EditorOptionValue = {
  key: string
  id?: string
  value: string
}

export type EditorOption = {
  key: string
  id?: string
  title: string
  values: EditorOptionValue[]
}

export type EditorVariantStatus = "active" | "stopped" | "delete"

export type EditorVariant = {
  key: string
  id?: string
  title: string
  sku: string
  price: number
  currency_code: string
  inventory_quantity: number
  manage_inventory: boolean
  option_values: Record<string, string>
  status: EditorVariantStatus
  initial_status: "active" | "stopped" | "new"
}

export type ProductVariantConfiguration = {
  options: EditorOption[]
  variants: EditorVariant[]
}

let keySequence = 0

export function createEditorKey(prefix: string) {
  keySequence += 1
  return `${prefix}_${Date.now().toString(36)}_${keySequence.toString(36)}`
}

function skuPart(value: string) {
  return toSlug(value)
    .toUpperCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12)
}

export function generateEditorSku(
  productTitle: string,
  variantTitle: string,
  usedSkus: Set<string>
) {
  const base = `${skuPart(productTitle) || "SKU"}-${skuPart(variantTitle) || "VAR"}`
    .slice(0, 28)
  let candidate = base
  let suffix = 2
  while (usedSkus.has(candidate)) {
    const suffixText = `-${suffix++}`
    candidate = `${base.slice(0, 32 - suffixText.length)}${suffixText}`
  }
  usedSkus.add(candidate)
  return candidate
}

export function isStoppedVariantMetadata(metadata?: Record<string, unknown> | null) {
  const value = metadata?.sales_disabled
  return value === true || value === "true"
}

export function initializeProductVariantConfiguration(
  product?: Product
): ProductVariantConfiguration {
  if (!product) return { options: [], variants: [] }

  const options: EditorOption[] = (product.options || []).map((option) => ({
    key: option.id,
    id: option.id,
    title: option.title,
    values: (option.values || []).map((value) => ({
      key: value.id || createEditorKey("value"),
      id: value.id,
      value: value.value,
    })),
  }))
  const optionKeyById = new Map(options.map((option) => [option.id, option.key]))

  const variants: EditorVariant[] = (product.variants || []).map((variant) => {
    const stopped = isStoppedVariantMetadata(variant.metadata)
    const optionValues: Record<string, string> = {}
    for (const value of variant.options || []) {
      const optionKey = optionKeyById.get(value.option_id)
      if (optionKey) optionValues[optionKey] = value.id
    }
    return {
      key: variant.id,
      id: variant.id,
      title: variant.title,
      sku: variant.sku || "",
      price: (variant.prices?.[0]?.amount || 0) / 100,
      currency_code: variant.prices?.[0]?.currency_code || "usd",
      inventory_quantity: variant.inventory_quantity || 0,
      manage_inventory: variant.manage_inventory ?? true,
      option_values: optionValues,
      status: stopped ? "stopped" : "active",
      initial_status: stopped ? "stopped" : "active",
    }
  })

  return { options, variants }
}

export function createDefaultProductVariantConfiguration(
  productTitle = ""
): ProductVariantConfiguration {
  const optionKey = createEditorKey("option")
  const valueKey = createEditorKey("value")
  const title = "默认"
  return {
    options: [{
      key: optionKey,
      title: "规格",
      values: [{ key: valueKey, value: title }],
    }],
    variants: [{
      key: createEditorKey("variant"),
      title,
      sku: generateEditorSku(productTitle, title, new Set()),
      price: 0,
      currency_code: "usd",
      inventory_quantity: 0,
      manage_inventory: true,
      option_values: { [optionKey]: valueKey },
      status: "active",
      initial_status: "new",
    }],
  }
}

export function variantCombinationSignature(
  options: EditorOption[],
  optionValues: Record<string, string>
) {
  return options
    .map((option) => `${option.key}:${optionValues[option.key] || ""}`)
    .sort()
    .join("|")
}

export function buildOptionCombinations(options: EditorOption[]) {
  if (options.length === 0 || options.some((option) => option.values.length === 0)) {
    return [] as Array<Record<string, string>>
  }
  return options.reduce<Array<Record<string, string>>>(
    (combinations, option) =>
      combinations.flatMap((combination) =>
        option.values.map((value) => ({
          ...combination,
          [option.key]: value.key,
        }))
      ),
    [{}]
  )
}

export function getVariantCombinationTitle(
  options: EditorOption[],
  optionValues: Record<string, string>
) {
  return options
    .map((option) =>
      option.values.find((value) => value.key === optionValues[option.key])?.value || "?"
    )
    .join(" / ")
}

export function reconcileVariantMatrix(
  configuration: ProductVariantConfiguration,
  productTitle: string
): ProductVariantConfiguration {
  const combinations = buildOptionCombinations(configuration.options)
  const existingBySignature = new Map<string, EditorVariant[]>()
  for (const variant of configuration.variants) {
    if (variant.status === "delete") continue
    const signature = variantCombinationSignature(
      configuration.options,
      variant.option_values
    )
    const matches = existingBySignature.get(signature) || []
    matches.push(variant)
    existingBySignature.set(signature, matches)
  }
  const usedSkus = new Set(configuration.variants.map((variant) => variant.sku).filter(Boolean))
  const retainedVariantKeys = new Set<string>()
  const variants = combinations.map((optionValues) => {
    const signature = variantCombinationSignature(configuration.options, optionValues)
    const existing = existingBySignature.get(signature)?.[0]
    if (existing) {
      retainedVariantKeys.add(existing.key)
      return existing
    }
    const title = getVariantCombinationTitle(configuration.options, optionValues)
    return {
      key: createEditorKey("variant"),
      title,
      sku: generateEditorSku(productTitle, title, usedSkus),
      price: 0,
      currency_code: "usd",
      inventory_quantity: 0,
      manage_inventory: true,
      option_values: optionValues,
      status: "active" as const,
      initial_status: "new" as const,
    }
  })

  for (const variant of configuration.variants) {
    if (retainedVariantKeys.has(variant.key)) continue
    if (variant.id) variants.push({ ...variant, status: "delete" })
  }

  return { ...configuration, variants }
}

export function getConfigurationErrors(configuration: ProductVariantConfiguration) {
  const errors: string[] = []
  const retained = configuration.variants.filter((variant) => variant.status !== "delete")
  if (configuration.options.length === 0) errors.push("至少添加一个选项")
  if (configuration.options.some((option) => !option.title.trim())) errors.push("选项名称不能为空")
  if (configuration.options.some((option) => option.values.length === 0)) errors.push("每个选项至少添加一个值")
  if (retained.length === 0) errors.push("至少保留一个规格")
  if (retained.some((variant) => !variant.sku.trim())) errors.push("SKU 不能为空")
  if (
    retained.some((variant) =>
      configuration.options.some((option) => !variant.option_values[option.key])
    )
  ) {
    errors.push("每个规格必须选择完整的选项值")
  }
  const signatures = retained.map((variant) =>
    variantCombinationSignature(configuration.options, variant.option_values)
  )
  if (new Set(signatures).size !== signatures.length) errors.push("规格选项组合不能重复")
  const skus = retained.map((variant) => variant.sku.trim().toLowerCase())
  if (new Set(skus).size !== skus.length) errors.push("SKU 不能重复")
  return errors
}

export function getConfigurationChangeSummary(configuration: ProductVariantConfiguration) {
  return {
    stop: configuration.variants.filter(
      (variant) => variant.id && variant.initial_status === "active" && variant.status === "stopped"
    ),
    restore: configuration.variants.filter(
      (variant) => variant.id && variant.initial_status === "stopped" && variant.status === "active"
    ),
    delete: configuration.variants.filter(
      (variant) => variant.id && variant.status === "delete"
    ),
  }
}

export function stopPendingDeleteVariant(
  configuration: ProductVariantConfiguration,
  variantId: string
) {
  const target = configuration.variants.find(
    (variant) => variant.id === variantId && variant.status === "delete"
  )
  if (!target) return null

  return {
    ...configuration,
    variants: configuration.variants.map((variant) =>
      variant.id === variantId ? { ...variant, status: "stopped" as const } : variant
    ),
  }
}
