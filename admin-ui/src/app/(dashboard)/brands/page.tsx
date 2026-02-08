"use client"

import { useTranslations } from "next-intl"
import { BrandTable } from "@/components/brands/brand-table"

export default function BrandsPage() {
  const t = useTranslations("brands")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <BrandTable />
    </div>
  )
}
