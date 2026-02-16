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
  params: Promise<{ handle: string }>
}

async function getBrand(handle: string) {
  return fetchContent<{ brand: Brand }>(`/store/content/brands/${handle}`)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const data = await getBrand(handle)
  if (!data?.brand) return { title: "品牌未找到 - TIMECIGAR" }
  return {
    title: `${data.brand.name} - TIMECIGAR`,
    description: data.brand.description || `${data.brand.name} - TIMECIGAR 合作品牌`,
  }
}

export default async function BrandDetailPage({ params }: Props) {
  const { handle } = await params
  const data = await getBrand(handle)
  if (!data?.brand) notFound()
  return <BrandDetailClient brand={data.brand} />
}
