export interface CartPromotion {
  code: string
  is_automatic?: boolean
}

export function normalizePromotionCode(code: string): string {
  return code.trim().toUpperCase()
}

export function getManualPromotionCodes(
  promotions: CartPromotion[] | undefined
): string[] {
  return (promotions || [])
    .filter((promotion) => !promotion.is_automatic)
    .map((promotion) => normalizePromotionCode(promotion.code))
}

export function hasPromotionCode(
  promotions: CartPromotion[] | undefined,
  code: string
): boolean {
  const normalizedCode = normalizePromotionCode(code)
  return getManualPromotionCodes(promotions).includes(normalizedCode)
}
