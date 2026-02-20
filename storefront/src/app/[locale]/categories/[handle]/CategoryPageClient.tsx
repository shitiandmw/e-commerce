"use client"

import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import { useLocale } from "@/lib/useLocale"

const PAGE_SIZE = 12

interface CategoryPageClientProps {
  category: { id: string; name: string; handle: string; description?: string | null }
  products: any[]
  totalCount: number
  currentPage: number
  currentSort?: string
}

const SORT_OPTIONS = [
  { value: "", label: "默认排序" },
  { value: "created_at", label: "最新上架" },
  { value: "price_asc", label: "价格从低到高" },
  { value: "price_desc", label: "价格从高到低" },
]

export default function CategoryPageClient({
  category,
  products,
  totalCount,
  currentPage,
  currentSort,
}: CategoryPageClientProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    return `${pathname}?${params.toString()}`
  }

  const handleSortChange = (value: string) => {
    router.push(buildUrl({ sort: value, page: "" }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted">
        <Link href={`/${locale}`} className="hover:text-gold">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-sm text-muted">{category.description}</p>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">共 {totalCount} 件商品</p>
        <select
          value={currentSort || ""}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted">该分类暂无商品</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildUrl({ page: String(currentPage - 1) })}
                  className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-gold"
                >
                  上一页
                </Link>
              )}
              <span className="px-3 text-sm text-muted">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={buildUrl({ page: String(currentPage + 1) })}
                  className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-gold"
                >
                  下一页
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
