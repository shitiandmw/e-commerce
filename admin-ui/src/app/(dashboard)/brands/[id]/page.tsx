"use client"

import { useParams } from "next/navigation"
import { BrandDetail } from "@/components/brands/brand-detail"

export default function BrandDetailPage() {
  const params = useParams()
  const brandId = params.id as string

  return <BrandDetail brandId={brandId} />
}
