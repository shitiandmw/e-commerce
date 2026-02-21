import { CategoryPageContent } from "@/components/product/category-page-content"
import {
  fetchCategoryByHandle,
  getCategoryBySlug,
} from "@/lib/data/categories"
import { fetchProducts } from "@/lib/data/products"
import type { Metadata } from "next"

const PAGE_SIZE = 20

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [medusaCategory, mockCategory] = await Promise.all([
    fetchCategoryByHandle(slug),
    Promise.resolve(getCategoryBySlug(slug)),
  ])
  const name = medusaCategory?.name || mockCategory?.name || "商品分類"
  const description = medusaCategory?.description || mockCategory?.description || "探索 TimeCigar 的精選雪茄系列"
  return {
    title: `${name} | TimeCigar 雪茄時間`,
    description,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10))
  const sort = String(sp.sort ?? "recommended")
  const offset = (page - 1) * PAGE_SIZE

  // Map frontend sort values to Medusa order param (price sort handled client-side)
  let order: string | undefined
  switch (sort) {
    case "name": order = "title"; break
    default: order = undefined
  }

  // Fetch category in parallel with mock fallback
  const [medusaCategory, mockCategory] = await Promise.all([
    fetchCategoryByHandle(slug),
    Promise.resolve(getCategoryBySlug(slug)),
  ])

  // Fetch products using the Medusa category ID
  const productsData = medusaCategory
    ? await fetchProducts({
        category_id: medusaCategory.id,
        limit: PAGE_SIZE,
        offset,
        order,
      })
    : { products: [], count: 0, offset: 0, limit: PAGE_SIZE }

  return (
    <CategoryPageContent
      slug={slug}
      categoryName={medusaCategory?.name || mockCategory?.name || ""}
      categoryNameEn={mockCategory?.nameEn || slug}
      categoryDescription={medusaCategory?.description || mockCategory?.description || ""}
      categoryImage={mockCategory?.image || "/images/hero-1.jpg"}
      medusaProducts={productsData.products}
      totalCount={productsData.count}
      currentPage={page}
      pageSize={PAGE_SIZE}
      currentSort={sort}
    />
  )
}
