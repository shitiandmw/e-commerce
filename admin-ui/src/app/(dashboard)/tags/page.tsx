"use client"

import { useTranslations } from "next-intl"
import { TagTable } from "@/components/tags/tag-table"

export default function TagsPage() {
  const t = useTranslations("tags")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <TagTable />
    </div>
  )
}
