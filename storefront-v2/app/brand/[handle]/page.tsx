import { notFound } from "next/navigation"
import { BrandPageContent } from "@/components/product/brand-page-content"
import { fetchBrand } from "@/lib/data/brands"
import { fetchProducts } from "@/lib/data/products"
import type { Metadata } from "next"

const PAGE_SIZE = 20

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const brand = await fetchBrand(handle)
  if (!brand) return { title: "品牌未找到 | TimeCigar 雪茄時間" }
  return {
    title: `${brand.name} | TimeCigar 雪茄時間`,
    description: brand.description || `探索 ${brand.name} 的精選雪茄系列`,
  }
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { handle } = await params
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

  let productsData = { products: [] as Awaited<ReturnType<typeof fetchProducts>>["products"], count: 0, offset: 0, limit: PAGE_SIZE }
  if (productIds.length > 0) {
    // Slice IDs for current page, then fetch those products
    const pageIds = productIds.slice(offset, offset + PAGE_SIZE)
    if (pageIds.length > 0) {
      const data = await fetchProducts({ ids: pageIds, limit: PAGE_SIZE, order })
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
