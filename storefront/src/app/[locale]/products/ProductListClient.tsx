"use client"

import { useState, useEffect, useCallback } from "react"
import ProductCard from "@/components/ProductCard"

interface Category {
  id: string
  name: string
  handle: string
}

interface Product {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variants?: {
    id: string
    title?: string
    options?: { id: string; value: string; option_id: string }[]
    prices?: { amount: number; currency_code: string }[]
    calculated_price?: { calculated_amount?: number; original_amount?: number; currency_code?: string }
  }[]
  options?: { id: string; title: string; values?: { id: string; value: string }[] }[]
  brand?: { name: string } | null
  metadata?: Record<string, unknown> | null
}

const LIMIT = 12

export default function ProductListClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [regionId, setRegionId] = useState<string>("")

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.product_categories || []))
      .catch(() => {})
    fetch("/api/regions")
      .then((r) => r.json())
      .then((data) => {
        const rid = data.regions?.[0]?.id
        if (rid) setRegionId(rid)
      })
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
        fields: "id,title,handle,thumbnail,variants.*,variants.prices.*,variants.options.*,+variants.calculated_price,options.*,options.values.*,*brand,metadata",
        order: sortOrder === "desc" ? `-${sortBy}` : sortBy,
      })
      if (selectedCategory) {
        params.set("category_id[]", selectedCategory)
      }
      if (regionId) {
        params.set("region_id", regionId)
      }
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
      setCount(data.count || 0)
    } catch {
      setProducts([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [offset, sortBy, sortOrder, selectedCategory, regionId])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const totalPages = Math.ceil(count / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <h1 className="mb-6 text-xl font-bold text-foreground md:text-2xl">全部商品</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 md:gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setOffset(0) }}
          className="min-h-[44px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("-")
            setSortBy(field)
            setSortOrder(order as "asc" | "desc")
            setOffset(0)
          }}
          className="min-h-[44px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="created_at-desc">最新上架</option>
          <option value="created_at-asc">最早上架</option>
          <option value="title-asc">名称 A-Z</option>
          <option value="title-desc">名称 Z-A</option>
        </select>

        <span className="ml-auto text-sm text-muted">
          共 {count} 件商品
        </span>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-surface">
              <div className="aspect-square bg-surface-light" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-16 rounded bg-surface-light" />
                <div className="h-4 w-full rounded bg-surface-light" />
                <div className="h-4 w-20 rounded bg-surface-light" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="mb-4 h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-lg text-muted">暂无商品</p>
          <p className="mt-1 text-sm text-muted">请稍后再来查看</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-gold disabled:opacity-40"
          >
            上一页
          </button>
          <span className="px-4 text-sm text-muted">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= count}
            className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-gold disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
