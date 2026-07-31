"use client"

import { useTranslations } from "next-intl"
import { useProduct, useProductSalePrices } from "@/hooks/use-products"
import { ProductForm } from "@/components/products/product-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
  getProductReturnTo,
  type ProductRouteSearchParams,
} from "@/lib/product-navigation"

interface EditProductPageProps {
  params: { id: string }
  searchParams?: ProductRouteSearchParams
}

export default function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const t = useTranslations("products")
  const productId = params.id
  const returnTo = getProductReturnTo(searchParams?.from)
  const { data, isLoading, isError, error } = useProduct(productId)
  const {
    data: salePriceData,
    isLoading: isLoadingSalePrices,
    isError: isSalePricesError,
    error: salePricesError,
  } = useProductSalePrices(productId)
  const loadError = error instanceof Error
    ? error
    : salePricesError instanceof Error
      ? salePricesError
      : null

  if (isLoading || isLoadingSalePrices) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || isSalePricesError || !data?.product || !salePriceData) {
    return (
      <div className="space-y-6">
        <Link href={returnTo}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {loadError?.message || t("productNotFound")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProductForm
      product={data.product}
      salePrices={salePriceData.sale_prices}
      mode="edit"
      returnTo={returnTo}
    />
  )
}
