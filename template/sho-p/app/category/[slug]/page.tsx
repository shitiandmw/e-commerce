import { CategoryPageContent } from "@/components/product/category-page-content"
import { getCategoryBySlug } from "@/lib/data/categories"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  return {
    title: `${category?.name || "商品分類"} | TimeCigar 雪茄時間`,
    description: category?.description || "探索 TimeCigar 的精選雪茄系列",
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CategoryPageContent slug={slug} />
}
