import { notFound } from "next/navigation"
import { BrandPageContent } from "@/components/product/brand-page-content"
import { fetchBrand } from "@/lib/data/brands"
import { fetchProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/region"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BRAND_PAGE_SIZE, loadBrandPageData } from "./load-brand-page-data"

export async function generateMetadata({ params }: { params: Promise<{ locale: string; handle: string }> }): Promise<Metadata> {
  const { locale, handle } = await params
  const t = await getTranslations({ locale })
  const brand = await fetchBrand(handle, locale)
  if (!brand) return { title: t('seo_not_found_brand') }
  return {
    title: brand.name,
    description: brand.description || t('seo_brand_description_fallback', { name: brand.name }),
  }
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; handle: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, handle } = await params
  const sp = await searchParams
  const data = await loadBrandPageData(
    { locale, handle, searchParams: sp },
    { fetchBrand, fetchProducts, getRegion }
  )
  if (!data) notFound()

  return (
    <BrandPageContent
      brand={data.brand}
      medusaProducts={data.productsData.products}
      totalCount={data.productsData.count}
      currentPage={data.page}
      pageSize={BRAND_PAGE_SIZE}
      currentSort={data.sort}
    />
  )
}
