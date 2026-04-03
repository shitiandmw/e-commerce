import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { fetchCollection, fetchProductPrices } from "@/lib/data/collections"
import { CollectionPageContent } from "@/components/collection/collection-page-content"

interface PageProps {
  params: Promise<{ locale: string; key: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, key } = await params
  const collection = await fetchCollection(key, locale)
  if (!collection) {
    const t = await getTranslations({ locale })
    return { title: t("collection_not_found") }
  }
  return {
    title: collection.name,
    description: collection.description ?? undefined,
  }
}

export default async function CollectionPage({ params }: PageProps) {
  const { locale, key } = await params
  const collection = await fetchCollection(key, locale)

  if (!collection) notFound()

  const productIds = collection.items
    .map((item) => item.product_id)
    .filter(Boolean)

  const priceMap = await fetchProductPrices(productIds, locale)

  const products = collection.items
    .filter((item) => item.product !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const priceInfo = priceMap.get(item.product_id)
      return {
        id: item.product!.id,
        title: item.product!.title,
        handle: item.product!.handle,
        thumbnail: item.product!.thumbnail,
        price: priceInfo?.price ?? null,
        currency_code: priceInfo?.currency_code ?? "usd",
      }
    })

  return <CollectionPageContent collection={collection} products={products} />
}
