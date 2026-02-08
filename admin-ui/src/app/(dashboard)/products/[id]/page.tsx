"use client"

import { useParams } from "next/navigation"
import { ProductDetail } from "@/components/products/product-detail"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  return <ProductDetail productId={productId} />
}
