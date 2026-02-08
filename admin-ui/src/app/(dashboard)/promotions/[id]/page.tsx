"use client"

import { useParams } from "next/navigation"
import { PromotionDetail } from "@/components/promotions/promotion-detail"

export default function PromotionDetailPage() {
  const params = useParams()
  const promotionId = params.id as string

  return <PromotionDetail promotionId={promotionId} />
}
