"use client"

import { useTranslations } from "next-intl"
import { ProductTable } from "@/components/products/product-table"

export default function ProductsPage() {
  const t = useTranslations("products")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <ProductTable />
    </div>
  )
}
