"use client"

import { useTranslations } from "next-intl"
import { BannerSlotTable } from "@/components/banners/banner-slot-table"

export default function BannersPage() {
  const t = useTranslations("banners")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <BannerSlotTable />
    </div>
  )
}
