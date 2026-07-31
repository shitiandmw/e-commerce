export interface OrderPromotionAdjustmentSource {
  code?: string | null
  promotion_id?: string | null
}

export interface OrderPromotionSource {
  id: string
  code?: string | null
  is_automatic?: boolean
}

export interface OrderPromotionDisplay {
  code: string
  promotion_id?: string
  is_automatic: boolean
}

interface OrderPromotionDataSource {
  items?: Array<{
    adjustments?: OrderPromotionAdjustmentSource[]
  }>
  shipping_methods?: Array<{
    adjustments?: OrderPromotionAdjustmentSource[]
  }>
  promotions?: OrderPromotionSource[]
}

function normalizeCode(code?: string | null) {
  return code?.trim().toUpperCase() || ""
}

export function getOrderPromotionDisplays(
  order: OrderPromotionDataSource
): OrderPromotionDisplay[] {
  const promotions = order.promotions ?? []
  const promotionById = new Map(promotions.map((promotion) => [promotion.id, promotion]))
  const promotionByCode = new Map(
    promotions.flatMap((promotion) => {
      const code = normalizeCode(promotion.code)
      return code ? [[code, promotion] as const] : []
    })
  )
  const representedPromotionIds = new Set<string>()
  const seenCodes = new Set<string>()
  const displays: OrderPromotionDisplay[] = []
  const adjustments = [
    ...(order.items ?? []).flatMap((item) => item.adjustments ?? []),
    ...(order.shipping_methods ?? []).flatMap(
      (method) => method.adjustments ?? []
    ),
  ]

  for (const adjustment of adjustments) {
    const normalizedCode = normalizeCode(adjustment.code)
    if (!normalizedCode || seenCodes.has(normalizedCode)) continue

    const promotion =
      (adjustment.promotion_id
        ? promotionById.get(adjustment.promotion_id)
        : undefined) ?? promotionByCode.get(normalizedCode)
    if (promotion) representedPromotionIds.add(promotion.id)
    seenCodes.add(normalizedCode)
    displays.push({
      code: adjustment.code!.trim(),
      promotion_id: promotion?.id,
      is_automatic: promotion?.is_automatic === true,
    })
  }

  for (const promotion of promotions) {
    if (representedPromotionIds.has(promotion.id)) continue
    const normalizedCode = normalizeCode(promotion.code)
    if (!normalizedCode || seenCodes.has(normalizedCode)) continue

    seenCodes.add(normalizedCode)
    displays.push({
      code: promotion.code!.trim(),
      promotion_id: promotion.id,
      is_automatic: promotion.is_automatic === true,
    })
  }

  return displays
}
