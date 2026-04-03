"use client"

import { useState } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import type { CuratedCollection, CollectionProductWithPrice } from "@/lib/data/collections"

interface CollectionPageContentProps {
  collection: CuratedCollection
  products: CollectionProductWithPrice[]
}

export function CollectionPageContent({ collection, products }: CollectionPageContentProps) {
  const t = useTranslations()
  const hasTabs = collection.tabs.length > 0
  const [activeTab, setActiveTab] = useState<string | null>(
    hasTabs ? collection.tabs[0]?.id ?? null : null,
  )

  // Build a map of item product_id -> tab_id for filtering
  const itemTabMap = new Map(
    collection.items.map((item) => [item.product_id, item.tab_id]),
  )

  const visibleProducts = hasTabs && activeTab
    ? products.filter((p) => itemTabMap.get(p.id) === activeTab)
    : products

  return (
    <div>
      {/* Header */}
      <div className="bg-card border-b border-border/30">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">
            {t("collection_label")}
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Tab Filter */}
        {hasTabs && (
          <div className="flex gap-1 mb-8 border-b border-border/30 overflow-x-auto">
            {collection.tabs
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-5 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                    activeTab === tab.id
                      ? "border-gold text-gold font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.name}
                </button>
              ))}
          </div>
        )}

        {/* Product count */}
        <p className="text-xs text-muted-foreground mb-6">
          {t("total_products", { count: visibleProducts.length })}
        </p>

        {/* Product Grid */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {visibleProducts.map((product) => (
              <CollectionProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">{t("no_products")}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CollectionProductCard({ product }: { product: CollectionProductWithPrice }) {
  const t = useTranslations()
  return (
    <Link
      href={`/product/${product.handle}`}
      className="group bg-card border border-border/30 hover:border-gold/30 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">{t("no_image")}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {product.title}
        </h3>
        <div className="mt-3">
          {product.price !== null ? (
            <span className="text-gold font-bold">
              {formatPrice(product.price, product.currency_code)}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">{t("price_tbd")}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
