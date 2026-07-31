import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type ActivePromotion = {
  code?: string
  is_automatic?: boolean
  limit?: number | null
  used?: number
}

type ActivePromotionService = {
  listActivePromotions: (
    filters: Record<string, unknown>,
    config?: Record<string, unknown>
  ) => Promise<ActivePromotion[]>
}

export function normalizePromotionCode(code: string): string {
  return code.trim().toUpperCase()
}

export async function getClaimablePromotionCodes(
  container: MedusaContainer,
  codes: string[]
): Promise<Set<string>> {
  const normalizedCodes = Array.from(
    new Set(codes.map(normalizePromotionCode).filter(Boolean))
  )
  if (normalizedCodes.length === 0) return new Set()

  // listActivePromotions enforces status and campaign dates at query time.
  const promotionService = container.resolve(
    Modules.PROMOTION
  ) as unknown as ActivePromotionService
  const promotions = await promotionService.listActivePromotions(
    { code: normalizedCodes, is_automatic: false },
    { select: ["code", "is_automatic", "limit", "used"] }
  )

  return new Set(
    promotions
      .filter(
        (promotion) =>
          promotion.code &&
          (promotion.limit == null || (promotion.used || 0) < promotion.limit)
      )
      .map((promotion) => normalizePromotionCode(promotion.code!))
  )
}
