export type PromotionStatus = "draft" | "active" | "inactive"
export type PromotionDisplayStatus =
  | "draft"
  | "active"
  | "inactive"
  | "scheduled"
  | "expired"

export interface PromotionStatusSource {
  status?: PromotionStatus
  campaign?: {
    starts_at?: string | null
    ends_at?: string | null
  } | null
}

export function getPromotionDisplayStatus(
  promotion: PromotionStatusSource,
  now = new Date()
): PromotionDisplayStatus {
  if (promotion.status === "draft") return "draft"
  if (promotion.status === "inactive") return "inactive"

  const startsAt = promotion.campaign?.starts_at
  const endsAt = promotion.campaign?.ends_at

  if (endsAt && new Date(endsAt) <= now) return "expired"
  if (startsAt && new Date(startsAt) > now) return "scheduled"

  return "active"
}
