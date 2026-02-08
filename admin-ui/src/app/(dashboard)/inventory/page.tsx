"use client"

import { useTranslations } from "next-intl"
import { InventoryTable } from "@/components/inventory/inventory-table"

export default function InventoryPage() {
  const t = useTranslations("inventory")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <InventoryTable />
    </div>
  )
}
