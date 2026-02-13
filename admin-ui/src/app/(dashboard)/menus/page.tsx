"use client"

import { useTranslations } from "next-intl"
import { MenuTable } from "@/components/menus/menu-table"

export default function MenusPage() {
  const t = useTranslations("menus")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <MenuTable />
    </div>
  )
}
