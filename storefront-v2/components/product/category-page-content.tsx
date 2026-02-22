"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { useRouter, useSearchParams } from "next/navigation"
import { Grid3X3, LayoutList, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { type MedusaProduct, getMedusaPrice } from "@/lib/data/products"
import { type MedusaCategory, buildCategoryTree } from "@/lib/data/categories"
import { ProductCard } from "@/components/product/product-card"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface CategoryPageContentProps {
  slug: string
  categoryName: string
  categoryNameEn: string
  categoryDescription: string
  categoryImage: string
  medusaProducts: MedusaProduct[]
  totalCount: number
  currentPage: number
  pageSize: number
  currentSort: string
  allCategories: MedusaCategory[]
}

export function CategoryPageContent({
  slug,
  categoryName,
  categoryNameEn,
  categoryDescription,
  categoryImage,
  medusaProducts,
  totalCount,
  currentPage,
  pageSize,
  currentSort,
  allCategories,
}: CategoryPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [gridCols, setGridCols] = useState<3 | 2>(3)

  const sortOptions = [
    { value: "recommended", label: t("sort_recommended") },
    { value: "price-asc", label: t("sort_price_asc") },
    { value: "price-desc", label: t("sort_price_desc") },
    { value: "name", label: t("sort_name") },
  ]

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Client-side price sort (Medusa API doesn't support sorting by variant prices)
  const sortedProducts = useMemo(() => {
    if (currentSort === "price-asc" || currentSort === "price-desc") {
      const sorted = [...medusaProducts].sort((a, b) => {
        const pa = getMedusaPrice(a)?.amount ?? 0
        const pb = getMedusaPrice(b)?.amount ?? 0
        return currentSort === "price-asc" ? pa - pb : pb - pa
      })
      return sorted
    }
    return medusaProducts
  }, [medusaProducts, currentSort])

  function buildUrl(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    if ("sort" in updates) params.delete("page")
    const qs = params.toString()
    return `/category/${slug}${qs ? `?${qs}` : ""}`
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src={categoryImage}
          alt={categoryName}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-6">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">{categoryNameEn}</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{categoryName}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">{categoryDescription}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Other Categories */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-4 tracking-wide">{t("other_categories")}</h3>
              <div className="flex flex-col gap-1">
                {buildCategoryTree(allCategories)
                  .filter(({ category: cat }) => cat.handle !== slug)
                  .map(({ category: cat, depth }) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.handle}`}
                    className="text-sm text-muted-foreground hover:text-gold transition-colors py-2"
                    style={{ paddingLeft: 12 + depth * 16 }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
              <span className="text-xs text-muted-foreground">
                {t("total_products", { count: totalCount })}
              </span>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={currentSort}
                    onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
                    className="appearance-none bg-transparent text-sm text-muted-foreground pr-6 cursor-pointer focus:outline-none hover:text-foreground transition-colors"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                </div>
                <div className="hidden md:flex items-center gap-1 border-l border-border/30 pl-3">
                  <button
                    onClick={() => setGridCols(3)}
                    className={cn("p-1 transition-colors", gridCols === 3 ? "text-gold" : "text-muted-foreground")}
                    aria-label={t("grid_3_col")}
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(2)}
                    className={cn("p-1 transition-colors", gridCols === 2 ? "text-gold" : "text-muted-foreground")}
                    aria-label={t("grid_2_col")}
                  >
                    <LayoutList className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {sortedProducts.length > 0 ? (
              <div className={cn(
                "grid gap-4 lg:gap-6",
                gridCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
              )}>
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">{t("no_products")}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Link
                  href={buildUrl({ page: String(currentPage - 1) })}
                  className={cn(
                    "size-9 flex items-center justify-center border border-border/30 text-sm transition-colors",
                    currentPage <= 1 ? "pointer-events-none opacity-30" : "hover:border-gold/50 hover:text-gold"
                  )}
                  aria-disabled={currentPage <= 1}
                >
                  <ChevronLeft className="size-4" />
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildUrl({ page: String(p) })}
                    className={cn(
                      "size-9 flex items-center justify-center border text-sm transition-colors",
                      p === currentPage
                        ? "border-gold text-gold bg-gold/5"
                        : "border-border/30 text-muted-foreground hover:border-gold/50 hover:text-gold"
                    )}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={buildUrl({ page: String(currentPage + 1) })}
                  className={cn(
                    "size-9 flex items-center justify-center border border-border/30 text-sm transition-colors",
                    currentPage >= totalPages ? "pointer-events-none opacity-30" : "hover:border-gold/50 hover:text-gold"
                  )}
                  aria-disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
