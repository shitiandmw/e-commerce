export type PromotionTargetType = "items" | "shipping_methods" | "order"
export type PromotionAllocation = "each" | "across" | ""
export const PRODUCT_TARGET_RULE_ATTRIBUTE = "items.product.id"

export type PromotionRuleValue = string | { value: string }

export interface PromotionTargetRuleSource {
  id?: string
  attribute: string
  operator: string
  values: PromotionRuleValue[]
}

export interface PromotionTargetRuleInput {
  attribute: typeof PRODUCT_TARGET_RULE_ATTRIBUTE
  operator: "eq"
  values: string[]
}

export interface PromotionTargetRuleBatch {
  create?: PromotionTargetRuleInput[]
  update?: Array<PromotionTargetRuleInput & { id: string }>
  delete?: string[]
}

export interface PromotionDiscountConfig {
  discount_type: "percentage" | "fixed"
  discount_value: number
  currency_code: string
  target_type: PromotionTargetType
  allocation?: PromotionAllocation
  max_quantity?: number
}

export interface PromotionApplicationMethodPayload {
  type: "percentage" | "fixed"
  value: number
  target_type: PromotionTargetType
  currency_code?: string
  allocation?: Exclude<PromotionAllocation, "">
  max_quantity?: number
}

export interface CouponDiscountConfig {
  discount_type: "percentage" | "fixed"
  discount_value: number
  currency_code: string
}

export interface CouponPromotionSource {
  type: string
  is_automatic: boolean
  rules?: unknown[]
  application_method?: {
    target_type?: string
    type?: string
    value?: number
    target_rules?: unknown[]
    buy_rules?: unknown[]
  } | null
}

function round(value: number, precision = 6): number {
  const factor = 10 ** precision
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function discountRateToPercentage(rate: number): number {
  return round(100 - rate * 10)
}

export function percentageToDiscountRate(percentage: number): number {
  return round((100 - percentage) / 10)
}

export function getCurrencyFractionDigits(currencyCode: string): number {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.trim().toUpperCase(),
    }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

export function majorToMinorAmount(
  amount: number,
  currencyCode: string
): number {
  return Math.round(amount * 10 ** getCurrencyFractionDigits(currencyCode))
}

export function minorToMajorAmount(
  amount: number,
  currencyCode: string
): number {
  return amount / 10 ** getCurrencyFractionDigits(currencyCode)
}

export function buildCouponApplicationMethod(
  config: CouponDiscountConfig
): PromotionApplicationMethodPayload {
  if (config.discount_type === "percentage") {
    return {
      type: "percentage",
      value: discountRateToPercentage(config.discount_value),
      target_type: "order",
    }
  }

  const currencyCode = config.currency_code.trim().toLowerCase()
  return {
    type: "fixed",
    value: majorToMinorAmount(config.discount_value, currencyCode),
    target_type: "order",
    currency_code: currencyCode,
  }
}

export function isEditableCoupon(promotion: CouponPromotionSource): boolean {
  const method = promotion.application_method
  const hasLegacyRules = Boolean(
    promotion.rules?.length ||
    method?.target_rules?.length ||
    method?.buy_rules?.length
  )
  const validDiscount =
    method?.type === "fixed" ||
    (method?.type === "percentage" &&
      typeof method.value === "number" &&
      method.value > 0 &&
      method.value < 100)

  return (
    promotion.type === "standard" &&
    !promotion.is_automatic &&
    method?.target_type === "order" &&
    validDiscount &&
    !hasLegacyRules
  )
}

/** Build only combinations accepted by Medusa's promotion calculator. */
export function buildApplicationMethod(
  config: PromotionDiscountConfig
): PromotionApplicationMethodPayload {
  const method: PromotionApplicationMethodPayload = {
    type: config.discount_type,
    value: config.discount_value,
    target_type: config.target_type,
  }

  if (config.discount_type === "fixed") {
    method.currency_code = config.currency_code.trim().toLowerCase()
  }

  // Order promotions are always allocated across the order by Medusa. Sending
  // `each` here overrides that behavior and caps each line with max_quantity.
  if (config.target_type !== "order") {
    const allocation = config.allocation || "across"
    method.allocation = allocation

    if (allocation === "each") {
      method.max_quantity = config.max_quantity
    }
  }

  return method
}

export function createCampaignIdentifier(code: string, now = Date.now()): string {
  const normalizedCode = code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "promotion"

  return `${normalizedCode}-${now.toString(36)}`
}

function normalizeIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)))
}

export function getProductIdsFromTargetRules(
  rules: PromotionTargetRuleSource[] | undefined
): string[] {
  const productRule = rules?.find(
    (rule) => rule.attribute === PRODUCT_TARGET_RULE_ATTRIBUTE
  )
  if (!productRule) return []

  return normalizeIds(
    productRule.values.map((value) =>
      typeof value === "string" ? value : value.value
    )
  )
}

export function buildProductTargetRule(
  productIds: string[]
): PromotionTargetRuleInput {
  return {
    attribute: PRODUCT_TARGET_RULE_ATTRIBUTE,
    operator: "eq",
    values: normalizeIds(productIds),
  }
}

/** Replace the current target scope with selected products, or clear it. */
export function buildProductTargetRuleBatch(
  existingRules: PromotionTargetRuleSource[] | undefined,
  selectedProductIds: string[] | null
): PromotionTargetRuleBatch {
  const existing = existingRules || []
  const existingProductRule = existing.find(
    (rule) =>
      rule.attribute === PRODUCT_TARGET_RULE_ATTRIBUTE && Boolean(rule.id)
  )
  const deleteIds = existing
    .filter((rule) => rule.id && rule.id !== existingProductRule?.id)
    .map((rule) => rule.id!)

  if (selectedProductIds == null) {
    const allRuleIds = existing
      .map((rule) => rule.id)
      .filter((id): id is string => Boolean(id))
    return allRuleIds.length > 0 ? { delete: allRuleIds } : {}
  }

  const targetRule = buildProductTargetRule(selectedProductIds)
  const batch: PromotionTargetRuleBatch = {}
  if (existingProductRule?.id) {
    batch.update = [{ id: existingProductRule.id, ...targetRule }]
  } else {
    batch.create = [targetRule]
  }
  if (deleteIds.length > 0) batch.delete = deleteIds

  return batch
}
