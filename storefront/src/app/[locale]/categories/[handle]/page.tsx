import { notFound } from "next/navigation"
import type { Metadata } from "next"
import CategoryPageClient from "./CategoryPageClient"

interface ProductCategory {
  id: string
  name: string
  handle: string
  description?: string | null
}

interface Props {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<{ sort?: string; page?: string }>
}

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function getCategory(handle: string, locale?: string): Promise<ProductCategory | null> {
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  if (locale) headers["x-medusa-locale"] = locale

  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/product-categories?handle=${encodeURIComponent(handle)}&limit=1`,
    { headers, next: { revalidate: 30 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.product_categories?.[0] ?? null
}

async function getProducts(categoryId: string, page: number, sort?: string, locale?: string) {
  const PAGE_SIZE = 12
  const offset = (page - 1) * PAGE_SIZE
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  if (locale) headers["x-medusa-locale"] = locale

  const url = new URL(`${MEDUSA_BACKEND_URL}/store/products`)
  url.searchParams.set("category_id[]", categoryId)
  url.searchParams.set("limit", String(PAGE_SIZE))
  url.searchParams.set("offset", String(offset))
  url.searchParams.set("fields", "+variants.calculated_price,+variants.prices,+options,+options.values,*brand")

  if (sort === "price_asc") url.searchParams.set("order", "variants.calculated_price.calculated_amount")
  else if (sort === "price_desc") url.searchParams.set("order", "-variants.calculated_price.calculated_amount")
  else if (sort === "created_at") url.searchParams.set("order", "-created_at")

  const res = await fetch(url.toString(), { headers, next: { revalidate: 30 } })
  if (!res.ok) return { products: [], count: 0 }
  const data = await res.json()
  return { products: data.products ?? [], count: data.count ?? 0 }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, locale } = await params
  const category = await getCategory(handle, locale)
  if (!category) return { title: "分类未找到" }
  return {
    title: `${category.name} - TIMECIGAR`,
    description: category.description || `${category.name} - 浏览该分类下的所有商品`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { handle, locale } = await params
  const sp = await searchParams
  const category = await getCategory(handle, locale)
  if (!category) notFound()

  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1)
  const { products, count } = await getProducts(category.id, page, sp.sort, locale)

  return (
    <CategoryPageClient
      category={category}
      products={products}
      totalCount={count}
      currentPage={page}
      currentSort={sp.sort}
    />
  )
}
