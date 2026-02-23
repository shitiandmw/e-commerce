import { CategoryPageContent } from "@/components/product/category-page-content"
import {
  fetchCategoryByHandle,
  fetchAllCategories,
  getCategoryBySlug,
} from "@/lib/data/categories"
import { fetchProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/region"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

const PAGE_SIZE = 20

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTranslations({ locale })
  const [medusaCategory, mockCategory] = await Promise.all([
    fetchCategoryByHandle(slug, locale),
    Promise.resolve(getCategoryBySlug(slug)),
  ])
  const name = medusaCategory?.name || mockCategory?.name || t('seo_not_found_category')
  const description = medusaCategory?.description || mockCategory?.description || t('seo_category_description_fallback')
  return {
    title: name,
    description,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
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

  // Fetch category and all categories in parallel with mock fallback
  const [medusaCategory, mockCategory, allCategories, region] = await Promise.all([
    fetchCategoryByHandle(slug, locale),
    Promise.resolve(getCategoryBySlug(slug)),
    fetchAllCategories(locale),
    getRegion(),
  ])

  // Fetch products using the Medusa category ID
  const productsData = medusaCategory
    ? await fetchProducts({
        category_id: medusaCategory.id,
        limit: PAGE_SIZE,
        offset,
        order,
        locale,
        region_id: region.id,
      })
    : { products: [], count: 0, offset: 0, limit: PAGE_SIZE }

  return (
    <CategoryPageContent
      slug={slug}
      categoryName={medusaCategory?.name || mockCategory?.name || ""}
      categoryNameEn={mockCategory?.nameEn || slug}
      categoryDescription={medusaCategory?.description || mockCategory?.description || ""}
      categoryImage={(medusaCategory?.metadata?.image_url as string) || mockCategory?.image || "/images/article-2.jpg"}
      medusaProducts={productsData.products}
      totalCount={productsData.count}
      currentPage={page}
      pageSize={PAGE_SIZE}
      currentSort={sort}
      allCategories={allCategories}
    />
  )
}
