import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchContent } from "@/lib/medusa"
import BrandDetailClient from "./BrandDetailClient"

interface Brand {
  id: string
  name: string
  description?: string | null
  logo_url?: string | null
  products?: any[]
}

interface Props {
  params: Promise<{ locale: string; handle: string }>
}

async function getBrand(handle: string, locale?: string) {
  const params: Record<string, string> = {}
  if (locale) params.locale = locale
  return fetchContent<{ brand: Brand }>(`/store/content/brands/${handle}`, Object.keys(params).length > 0 ? params : undefined)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, locale } = await params
  const data = await getBrand(handle, locale)
  if (!data?.brand) return { title: "品牌未找到" }
  return {
    title: data.brand.name,
    description: data.brand.description || `${data.brand.name} - TIMECIGAR 合作品牌`,
  }
}

export default async function BrandDetailPage({ params }: Props) {
  const { handle, locale } = await params
  const data = await getBrand(handle, locale)
  if (!data?.brand) notFound()
  return <BrandDetailClient brand={data.brand} />
}
