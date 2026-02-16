"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import ProductCard from "@/components/ProductCard"

interface Brand {
  id: string
  name: string
  description?: string | null
  logo_url?: string | null
  products?: any[]
}

const PAGE_SIZE = 12

export default function BrandDetailClient({ brand }: { brand: Brand }) {
  const allProducts = brand.products || []
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(allProducts.length / PAGE_SIZE)
  const visibleProducts = allProducts.slice(0, page * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-6">
        {brand.logo_url ? (
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-surface-light">
            <Image src={brand.logo_url} alt={brand.name} fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-surface-light text-2xl font-bold text-gold">
            {brand.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{brand.name}</h1>
          {brand.description && (
            <p className="mt-2 text-sm text-muted">{brand.description}</p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted">
        <Link href="/brands" className="hover:text-gold">品牌</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      {/* Products */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        品牌商品 ({allProducts.length})
      </h2>

      {allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted">该品牌暂无商品</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {visibleProducts.length < allProducts.length && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-6 py-2 text-sm text-foreground transition-colors hover:border-gold"
              >
                加载更多
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
