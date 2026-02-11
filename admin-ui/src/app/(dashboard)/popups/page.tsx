"use client"

import { useTranslations } from "next-intl"
import { PopupTable } from "@/components/popups/popup-table"

export default function PopupsPage() {
  const t = useTranslations("popups")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <PopupTable />
    </div>
  )
}
