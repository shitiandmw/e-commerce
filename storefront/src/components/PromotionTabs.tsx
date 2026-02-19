"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"

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
    variants?: {
      calculated_price?: {
        calculated_amount: number
        original_amount?: number
        currency_code: string
      }
    }[]
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

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ProductCarousel({ items }: { items: CollectionItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-muted">暂无商品</p>
  }

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-muted shadow transition-colors hover:border-gold hover:text-gold"
        aria-label="向左滚动"
      >
        <ChevronLeft />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth px-1 py-2 scrollbar-hide">
        {items.map((item) => {
          const p = item.product
          if (!p) return null
          const price = p.variants?.[0]?.calculated_price
          const hasDiscount = price?.original_amount != null && price.original_amount > price.calculated_amount
          return (
            <Link
              key={item.id}
              href={`/products/${p.handle}`}
              className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/50 sm:w-48"
            >
              <div className="relative aspect-square overflow-hidden bg-surface-light">
                {p.thumbnail ? (
                  <Image src={p.thumbnail} alt={p.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="200px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1" /></svg>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h4 className="mb-1 truncate text-xs font-medium text-foreground group-hover:text-gold">{p.title}</h4>
                {price && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gold">
                      {price.currency_code === "cny" ? "¥" : price.currency_code.toUpperCase()} {price.calculated_amount}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-muted line-through">
                        {price.currency_code === "cny" ? "¥" : price.currency_code.toUpperCase()} {price.original_amount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-muted shadow transition-colors hover:border-gold hover:text-gold"
        aria-label="向右滚动"
      >
        <ChevronRight />
      </button>
    </div>
  )
}

export default function PromotionTabs({ collections }: { collections: CuratedCollection[] }) {
  // Flatten all tabs from all collections into a single tab bar
  const allTabs = collections.flatMap((c) =>
    c.tabs.map((t) => ({ ...t, collectionId: c.id }))
  ).sort((a, b) => a.sort_order - b.sort_order)

  const [activeTabId, setActiveTabId] = useState<string | null>(
    allTabs.length > 0 ? allTabs[0].id : null
  )

  if (allTabs.length === 0) return null

  // Find items for active tab
  const activeItems = collections
    .flatMap((c) => c.items)
    .filter((item) => item.tab_id === activeTabId)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-16">
      <h2 className="mb-6 text-center text-xl font-bold text-gold md:text-2xl">
        精选推荐
      </h2>
      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap justify-center gap-1">
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTabId === tab.id
                ? "text-gold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.name}
            {activeTabId === tab.id && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gold" />
            )}
          </button>
        ))}
      </div>
      {/* Product carousel */}
      <ProductCarousel items={activeItems} />
    </section>
  )
}
