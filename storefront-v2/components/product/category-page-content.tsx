"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { SlidersHorizontal, Grid3X3, LayoutList, ChevronDown } from "lucide-react"
import { products, type Product } from "@/lib/data/products"
import { getCategoryBySlug, categories } from "@/lib/data/categories"
import { ProductCard } from "@/components/product/product-card"
import { cn } from "@/lib/utils"

const strengths = ["全部", "輕", "中", "中強", "強"] as const
const sortOptions = [
  { value: "recommended", label: "推薦排序" },
  { value: "price-asc", label: "價格：低至高" },
  { value: "price-desc", label: "價格：高至低" },
  { value: "name", label: "名稱 A-Z" },
]

export function CategoryPageContent({ slug }: { slug: string }) {
  const category = getCategoryBySlug(slug)
  const [selectedBrand, setSelectedBrand] = useState("全部")
  const [selectedStrength, setSelectedStrength] = useState("全部")
  const [sortBy, setSortBy] = useState("recommended")
  const [showFilters, setShowFilters] = useState(false)
  const [gridCols, setGridCols] = useState<3 | 2>(3)

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.category === slug)
    if (selectedBrand !== "全部") {
      result = result.filter(p => p.brandEn === selectedBrand)
    }
    if (selectedStrength !== "全部") {
      result = result.filter(p => p.strength === selectedStrength)
    }
    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break
      case "price-desc": result.sort((a, b) => b.price - a.price); break
      case "name": result.sort((a, b) => a.nameEn.localeCompare(b.nameEn)); break
    }
    return result
  }, [slug, selectedBrand, selectedStrength, sortBy])

  const categoryName = category?.name || "全部雪茄"
  const categoryDescription = category?.description || ""
  const brands = category?.brands || []

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src={category?.image || "/images/hero-1.jpg"}
          alt={categoryName}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-6">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">{category?.nameEn}</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{categoryName}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">{categoryDescription}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            {/* Brands */}
            {brands.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-foreground mb-4 tracking-wide">品牌</h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedBrand("全部")}
                    className={cn(
                      "text-left px-3 py-2 text-sm transition-colors rounded-sm",
                      selectedBrand === "全部" ? "text-gold bg-gold/5" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    全部品牌
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand.slug}
                      onClick={() => setSelectedBrand(brand.nameEn)}
                      className={cn(
                        "flex items-center gap-2.5 text-left px-3 py-2 text-sm transition-colors rounded-sm",
                        selectedBrand === brand.nameEn ? "text-gold bg-gold/5" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "size-6 shrink-0 inline-flex items-center justify-center rounded text-[8px] font-bold uppercase border",
                          selectedBrand === brand.nameEn
                            ? "bg-gold/15 border-gold/40 text-gold"
                            : "bg-gold/5 border-gold/15 text-gold/60"
                        )}
                      >
                        {brand.logo || brand.nameEn.charAt(0)}
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span>{brand.name}</span>
                        <span className="text-muted-foreground/40 text-[10px]">{brand.nameEn}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Strength */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-foreground mb-4 tracking-wide">強度</h3>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStrength(s)}
                    className={cn(
                      "px-3 py-1.5 text-xs border transition-colors",
                      selectedStrength === s
                        ? "border-gold text-gold bg-gold/5"
                        : "border-border/50 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Other Categories */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-4 tracking-wide">其他分類</h3>
              <div className="flex flex-col gap-1">
                {categories.filter(c => c.slug !== slug).map((cat) => (
                  <a
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-gold transition-colors px-3 py-2"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SlidersHorizontal className="size-4" />
                  篩選
                </button>
                <span className="text-xs text-muted-foreground">
                  共 {filteredProducts.length} 款產品
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent text-sm text-muted-foreground pr-6 cursor-pointer focus:outline-none hover:text-foreground transition-colors"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {/* Grid toggle */}
                <div className="hidden md:flex items-center gap-1 border-l border-border/30 pl-3">
                  <button
                    onClick={() => setGridCols(3)}
                    className={cn("p-1 transition-colors", gridCols === 3 ? "text-gold" : "text-muted-foreground")}
                    aria-label="三列佈局"
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(2)}
                    className={cn("p-1 transition-colors", gridCols === 2 ? "text-gold" : "text-muted-foreground")}
                    aria-label="兩列佈局"
                  >
                    <LayoutList className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 p-4 bg-card border border-border/30">
                {brands.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-foreground mb-3">品牌</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedBrand("全部")}
                        className={cn(
                          "px-3 py-1.5 text-xs border transition-colors",
                          selectedBrand === "全部" ? "border-gold text-gold" : "border-border/50 text-muted-foreground"
                        )}
                      >
                        全部
                      </button>
                      {brands.map((brand) => (
                        <button
                          key={brand.slug}
                          onClick={() => setSelectedBrand(brand.nameEn)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors",
                            selectedBrand === brand.nameEn ? "border-gold text-gold" : "border-border/50 text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "size-4 shrink-0 inline-flex items-center justify-center rounded text-[6px] font-bold uppercase",
                              selectedBrand === brand.nameEn
                                ? "bg-gold/15 text-gold"
                                : "bg-gold/5 text-gold/50"
                            )}
                          >
                            {brand.logo || brand.nameEn.charAt(0)}
                          </span>
                          {brand.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-medium text-foreground mb-3">強度</h3>
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStrength(s)}
                        className={cn(
                          "px-3 py-1.5 text-xs border transition-colors",
                          selectedStrength === s ? "border-gold text-gold" : "border-border/50 text-muted-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className={cn(
                "grid gap-4 lg:gap-6",
                gridCols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
              )}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">暫無符合條件的產品</p>
                <button
                  onClick={() => { setSelectedBrand("全部"); setSelectedStrength("全部") }}
                  className="mt-4 text-sm text-gold hover:text-gold-light transition-colors"
                >
                  清除篩選條件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
