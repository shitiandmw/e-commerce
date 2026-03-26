import { fetchProduct, fetchRelatedProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/region"
import { ProductDetailContent } from "@/components/product/product-detail-content"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string; handle: string }> }): Promise<Metadata> {
  const { locale, handle } = await params
  const region = await getRegion()
  const product = await fetchProduct(handle, locale, region.id)
  if (!product) {
    const t = await getTranslations({ locale })
    return { title: t('seo_not_found_product') }
  }
  return {
    title: product.title,
    description: product.description ?? undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; handle: string }> }) {
  const { locale, handle } = await params
  const region = await getRegion()
  const product = await fetchProduct(handle, locale, region.id)
  if (!product) notFound()

  const relatedProducts = await fetchRelatedProducts(product, 4, locale, region.id)

  return <ProductDetailContent product={product} relatedProducts={relatedProducts} />
}
