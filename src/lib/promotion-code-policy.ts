export const MULTIPLE_PROMOTION_CODES_MESSAGE =
  "Only one discount code can be applied to an order."
export const REPLACE_PROMOTION_CODE_MESSAGE =
  "Remove the current discount code before applying another one."

export interface PromotionCodeSource {
  code?: string
  is_automatic?: boolean
}

export function normalizePromotionCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(
    value
      .filter((code): code is string => typeof code === "string")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
  ))
}

export function getPromotionCodePolicyError(
  requestedCodes: string[],
  existingPromotions: PromotionCodeSource[] = []
): string | null {
  if (requestedCodes.length > 1) return MULTIPLE_PROMOTION_CODES_MESSAGE
  if (requestedCodes.length === 0) return null

  const existingManualCode = existingPromotions.find(
    (promotion) => !promotion.is_automatic && promotion.code
  )?.code?.trim().toUpperCase()

  if (existingManualCode && existingManualCode !== requestedCodes[0]) {
    return REPLACE_PROMOTION_CODE_MESSAGE
  }
  return null
}
