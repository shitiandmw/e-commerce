"use client"

import { useState } from "react"
import Link from "next/link"

interface CollectionTab {
  id: string
  name: string
  key: string
  sort_order: number
}

interface CollectionItem {
  id: string
  product_id: string
  tab_id: string | null
  sort_order: number
  product?: {
    id: string
    title: string
    handle: string
    thumbnail?: string
    variants?: { calculated_price?: { calculated_amount: number; currency_code: string } }[]
  }
}

interface CuratedCollection {
  id: string
  name: string
  key: string
  description?: string
  tabs: CollectionTab[]
  items: CollectionItem[]
}

export default function CuratedCollections({
  collections,
}: {
  collections: CuratedCollection[]
}) {
  if (!collections || collections.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      {collections.map((collection) => (
        <CollectionBlock key={collection.id} collection={collection} />
      ))}
    </section>
  )
}

function CollectionBlock({ collection }: { collection: CuratedCollection }) {
  const tabs = [...collection.tabs].sort((a, b) => a.sort_order - b.sort_order)
  const [activeTab, setActiveTab] = useState<string | null>(
    tabs.length > 0 ? tabs[0].id : null
  )

  const filteredItems = activeTab
    ? collection.items.filter((item) => item.tab_id === activeTab)
    : collection.items

  const sortedItems = [...filteredItems].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  return (
    <div className="mb-12">
      <h2 className="mb-2 text-center text-2xl font-bold text-gold">
        {collection.name}
      </h2>
      {collection.description && (
        <p className="mb-6 text-center text-sm text-muted">
          {collection.description}
        </p>
      )}

      {tabs.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-5 py-2 text-sm transition ${
                activeTab === tab.id
                  ? "bg-gold text-background"
                  : "border border-border text-muted hover:border-gold hover:text-gold"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      {sortedItems.length === 0 ? (
        <p className="py-12 text-center text-muted">暂无商品</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {sortedItems.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ item }: { item: CollectionItem }) {
  const product = item.product
  if (!product) return null

  const price = product.variants?.[0]?.calculated_price
  const href = `/products/${product.handle}`

  return (
    <Link href={href} className="group block overflow-hidden rounded-lg bg-surface transition hover:ring-1 hover:ring-gold/30">
      <div className="aspect-square overflow-hidden bg-surface-light">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-foreground">
          {product.title}
        </h3>
        {price && (
          <p className="mt-1 text-sm text-gold">
            {price.currency_code === "cny" ? "¥" : price.currency_code.toUpperCase()}{" "}
            {price.calculated_amount}
          </p>
        )}
      </div>
    </Link>
  )
}
