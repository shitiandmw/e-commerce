"use client"

import { useTranslations } from "next-intl"
import { CollectionTable } from "@/components/collections/collection-table"

export default function CollectionsPage() {
  const t = useTranslations("collections")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <CollectionTable />
    </div>
  )
}
