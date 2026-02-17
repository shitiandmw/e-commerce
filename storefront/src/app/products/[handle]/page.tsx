import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { sdk } from "@/lib/medusa"
import ProductDetailClient from "./ProductDetailClient"

interface Props {
  params: Promise<{ handle: string }>
}

async function getProduct(handle: string) {
  try {
    const { products } = await sdk.store.product.list({
      handle,
      fields: "id,title,handle,subtitle,description,thumbnail,images.*,options.*,options.values.*,variants.*,variants.options.*,variants.prices.*,variants.inventory_quantity,*brand,tags.*,metadata",
      limit: 1,
    })
    return products?.[0] || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) return { title: "商品未找到" }

  const seo = (product.metadata as any)?.seo as
    | { meta_title?: string; meta_description?: string; og_image?: string; keywords?: string }
    | undefined

  const isCustomTitle = !!seo?.meta_title
  const displayTitle = isCustomTitle ? seo!.meta_title! : (product.title || "")
  const description =
    seo?.meta_description || product.description || `${product.title} - TIMECIGAR 精选雪茄`
  const ogImage = seo?.og_image || product.thumbnail || undefined

  return {
    title: isCustomTitle ? { absolute: displayTitle } : displayTitle,
    description,
    keywords: seo?.keywords || undefined,
    openGraph: {
      title: isCustomTitle ? displayTitle : `${displayTitle} - TIMECIGAR`,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()
  return <ProductDetailClient product={product as any} />
}
