"use client"

import { useTranslations } from "next-intl"
import { ProductCategoryManager } from "@/components/product-categories/category-manager"

export default function ProductCategoriesPage() {
  const t = useTranslations("productCategories")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ProductCategoryManager />
    </div>
  )
}
