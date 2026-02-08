"use client"

import { PromotionTable } from "@/components/promotions/promotion-table"

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
        <p className="text-muted-foreground">
          Manage discount promotions and coupon codes
        </p>
      </div>

      <PromotionTable />
    </div>
  )
}
