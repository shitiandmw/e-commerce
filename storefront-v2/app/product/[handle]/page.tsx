import { fetchProduct, fetchRelatedProducts } from "@/lib/data/products"
import { ProductDetailContent } from "@/components/product/product-detail-content"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const product = await fetchProduct(handle)
  if (!product) return { title: "找不到商品 | TimeCigar" }
  return {
    title: `${product.title} | TimeCigar 雪茄時間`,
    description: product.description ?? undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const product = await fetchProduct(handle)
  if (!product) notFound()

  const relatedProducts = await fetchRelatedProducts(product)

  return <ProductDetailContent product={product} relatedProducts={relatedProducts} />
}
