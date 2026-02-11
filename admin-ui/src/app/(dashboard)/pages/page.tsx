"use client"

import { useTranslations } from "next-intl"
import { PageTable } from "@/components/pages/page-table"

export default function PagesPage() {
  const t = useTranslations("pages")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <PageTable />
    </div>
  )
}
