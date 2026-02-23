import { notFound } from "next/navigation"
import { BrandPageContent } from "@/components/product/brand-page-content"
import { fetchBrand } from "@/lib/data/brands"
import { fetchProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/region"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

const PAGE_SIZE = 20

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
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10))
  const sort = String(sp.sort ?? "recommended")
  const offset = (page - 1) * PAGE_SIZE

  let order: string | undefined
  switch (sort) {
    case "name": order = "title"; break
    default: order = undefined
  }

  const brand = await fetchBrand(handle)
  if (!brand) notFound()

  // Get product IDs from brand, then fetch full product data
  const productIds = brand.products?.map((p) => p.id) ?? []
  const region = await getRegion()

  let productsData = { products: [] as Awaited<ReturnType<typeof fetchProducts>>["products"], count: 0, offset: 0, limit: PAGE_SIZE }
  if (productIds.length > 0) {
    // Slice IDs for current page, then fetch those products
    const pageIds = productIds.slice(offset, offset + PAGE_SIZE)
    if (pageIds.length > 0) {
      const data = await fetchProducts({ ids: pageIds, limit: PAGE_SIZE, order, locale, region_id: region.id })
      productsData = { ...data, count: productIds.length }
    } else {
      productsData = { products: [], count: productIds.length, offset, limit: PAGE_SIZE }
    }
  }

  return (
    <BrandPageContent
      brand={brand}
      medusaProducts={productsData.products}
      totalCount={productsData.count}
      currentPage={page}
      pageSize={PAGE_SIZE}
      currentSort={sort}
    />
  )
}
