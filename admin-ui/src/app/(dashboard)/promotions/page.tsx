"use client"

import { useTranslations } from "next-intl"
import { PromotionTable } from "@/components/promotions/promotion-table"

export default function PromotionsPage() {
  const t = useTranslations("promotions")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <PromotionTable />
    </div>
  )
}
