"use client"

import { ProductDetail } from "@/components/products/product-detail"
import {
  getProductReturnTo,
  type ProductRouteSearchParams,
} from "@/lib/product-navigation"

interface ProductDetailPageProps {
  params: { id: string }
  searchParams?: ProductRouteSearchParams
}

export default function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const returnTo = getProductReturnTo(searchParams?.from)

  return <ProductDetail productId={params.id} returnTo={returnTo} />
}
