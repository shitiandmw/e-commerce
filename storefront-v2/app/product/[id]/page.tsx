import { getProductById, products } from "@/lib/data/products"
import { ProductDetailContent } from "@/components/product/product-detail-content"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(id)
  if (!product) return { title: "找不到商品 | TimeCigar" }
  return {
    title: `${product.name} (${product.nameEn}) | TimeCigar 雪茄時間`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = getProductById(id)
  if (!product) notFound()

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return <ProductDetailContent product={product} relatedProducts={relatedProducts} />
}
