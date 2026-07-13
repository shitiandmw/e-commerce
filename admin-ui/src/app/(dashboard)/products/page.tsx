"use client"

import { useTranslations } from "next-intl"
import { ProductTable } from "@/components/products/product-table"
import {
  parseProductListState,
  type ProductRouteSearchParams,
} from "@/lib/product-navigation"

interface ProductsPageProps {
  searchParams?: ProductRouteSearchParams
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const t = useTranslations("products")
  const initialState = parseProductListState(searchParams)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <ProductTable initialState={initialState} />
    </div>
  )
}
