import type { Metadata } from "next"
import { fetchContent } from "@/lib/medusa"
import BrandListClient from "./BrandListClient"

export const metadata: Metadata = {
  title: "品牌 - TIMECIGAR",
  description: "浏览 TIMECIGAR 合作品牌",
}

interface Brand {
  id: string
  name: string
  description?: string | null
  logo_url?: string | null
}

interface BrandsResponse {
  brands: Brand[]
  count: number
  offset: number
  limit: number
}

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let brands: Brand[] = []
  try {
    const data = await fetchContent<BrandsResponse>("/store/content/brands", { limit: "100", locale })
    brands = data?.brands || []
  } catch (e) {
    console.error("Failed to fetch brands:", e)
  }

  return <BrandListClient initialBrands={brands} />
}
