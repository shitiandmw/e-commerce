"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingBag, Heart, Share2, ChevronRight, Loader2 } from "lucide-react"
import { type MedusaProduct, type MedusaBrand, getMedusaImages } from "@/lib/data/products"
import { useCart } from "@/lib/cart-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product/product-card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ProductDetailContent({
  product,
  relatedProducts,
}: {
  product: MedusaProduct
  relatedProducts: MedusaProduct[]
}) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    // Auto-select if only one variant
    if (product.variants?.length === 1 && product.options) {
      const init: Record<string, string> = {}
      for (const opt of product.options) {
        if (opt.values?.length === 1) init[opt.id] = opt.values[0].value
      }
      return init
    }
    return {}
  })
  const addItem = useCart((s) => s.addItem)
  const clearCart = useCart((s) => s.clear)
  const [adding, setAdding] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const router = useRouter()
  const images = getMedusaImages(product)
  const meta = (product.metadata ?? {}) as Record<string, string | undefined>
  const categoryName = product.categories?.[0]?.name ?? ""
  const categoryHandle = product.categories?.[0]?.handle ?? ""

  const hasMultipleVariants = (product.variants?.length ?? 0) > 1
  const hasOptions = (product.options?.length ?? 0) > 0 && hasMultipleVariants

  // Find selected variant based on option selections (Medusa official pattern)
  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return undefined
    // Single variant → always selected
    if (product.variants.length === 1) return product.variants[0]
    // Need all options selected
    if (!product.options || Object.keys(selectedOptions).length !== product.options.length) return undefined
    return product.variants.find((variant) =>
      variant.options?.every(
        (optionValue) => selectedOptions[optionValue.option_id] === optionValue.value
      )
    )
  }, [selectedOptions, product])

  // Price from selected variant, or cheapest variant as fallback
  const variantPrice = useMemo(() => {
    const v = selectedVariant
    if (v?.prices?.length) {
      const p = v.prices[0]
      return { amount: p.amount, currency_code: p.currency_code }
    }
    // Fallback: cheapest across all variants
    const cheapest = product.variants
      ?.flatMap((vr) => vr.prices ?? [])
      .sort((a, b) => a.amount - b.amount)[0]
    return cheapest ? { amount: cheapest.amount, currency_code: cheapest.currency_code } : null
  }, [selectedVariant, product])

  // Inventory
  const inventory = selectedVariant?.inventory_quantity
  const manageInventory = selectedVariant?.manage_inventory !== false
  const isOutOfStock = manageInventory && inventory !== undefined && inventory <= 0
  const isLowStock = manageInventory && inventory !== undefined && inventory > 0 && inventory <= 5
  const canAddToCart = !!selectedVariant && !isOutOfStock

  // Cigar-specific metadata (may or may not exist)
  const origin = meta.origin
  const wrapper = meta.wrapper
  const binder = meta.binder
  const filler = meta.filler
  const strength = meta.strength as "輕" | "中" | "中強" | "強" | undefined
  const cigarLength = meta.length
  const ringGauge = meta.ring_gauge
  const packSize = meta.pack_size
  const tastingNotes = meta.tasting_notes
  const pairingNotes = meta.pairing_notes
  const brandName = meta.brand_name
  const brandNameEn = meta.brand_name_en
  const brand: MedusaBrand | undefined = Array.isArray(product.brand) ? product.brand[0] : product.brand
  const displayBrandName = brand?.name ?? brandName
  const displayBrandNameEn = brandNameEn
  const brandDescription = brand?.description
  const isLimited = meta.is_limited === "true"

  // Custom attributes from admin editor (metadata.attributes)
  const rawAttrs = (product.metadata as Record<string, unknown> | null)?.attributes
  const customAttributes = Array.isArray(rawAttrs)
    ? (rawAttrs as { key: string; value: string }[]).filter((a) => a.key && a.value)
    : []

  const hasCigarSpecs = !!(origin || wrapper || binder || filler || cigarLength || ringGauge || strength)
  const hasSpecs = hasCigarSpecs || customAttributes.length > 0

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 py-4 lg:px-6" aria-label="breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-gold transition-colors">首頁</Link></li>
          <li><ChevronRight className="size-3" /></li>
          {categoryHandle && (
            <>
              <li><Link href={`/category/${categoryHandle}`} className="hover:text-gold transition-colors">
                {categoryName}
              </Link></li>
              <li><ChevronRight className="size-3" /></li>
            </>
          )}
          <li className="text-foreground/60">{product.title}</li>
        </ol>
      </nav>

      {/* Product Main Section */}
      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2 sm:w-20 shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative aspect-square w-16 sm:w-full overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? "border-gold" : "border-border/30 hover:border-border"
                    }`}
                  >
                    <Image src={img} alt={`${product.title} - ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative aspect-square flex-1 overflow-hidden bg-card">
              <Image
                src={images[selectedImage] || "/images/placeholder.jpg"}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              {isLimited && (
                <div className="absolute top-4 left-4 bg-gold/90 text-primary-foreground text-xs font-bold px-3 py-1.5 tracking-wider">
                  LIMITED EDITION
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {(displayBrandNameEn || displayBrandName) && (
              <p className="text-gold text-xs tracking-[0.3em] uppercase">{displayBrandNameEn || displayBrandName}</p>
            )}
            <h1 className="mt-2 text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">{product.title}</h1>
            {product.subtitle && (
              <p className="mt-1 text-base text-muted-foreground">{product.subtitle}</p>
            )}

            {/* Price */}
            <div className="mt-6 pb-6 border-b border-border/30">
              <div className="flex items-baseline gap-3">
                {variantPrice ? (
                  <span className="text-3xl font-bold text-gold">
                    {!selectedVariant && hasMultipleVariants && <span className="text-lg font-normal text-muted-foreground mr-1">從</span>}
                    {variantPrice.currency_code === "hkd" ? "HK$" : variantPrice.currency_code.toUpperCase() + " "}
                    {variantPrice.amount.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">價格待定</span>
                )}
              </div>
              {packSize && (
                <p className="mt-1.5 text-xs text-muted-foreground">{packSize} 支裝 / 盒</p>
              )}
              {/* Stock status */}
              {selectedVariant && (
                <div className="mt-2 flex items-center gap-2">
                  {isOutOfStock ? (
                    <>
                      <span className="size-1.5 rounded-full bg-destructive" />
                      <span className="text-xs text-destructive">缺貨</span>
                    </>
                  ) : isLowStock ? (
                    <>
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      <span className="text-xs text-amber-600">僅剩 {inventory} 件</span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">有貨</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Variant / Option Selection */}
            {hasOptions && (
              <div className="mt-6 flex flex-col gap-5" role="group" aria-label="商品規格選擇">
                {product.options!.map((option) => (
                  <div key={option.id}>
                    <p className="text-sm font-medium text-foreground mb-2.5">
                      {option.title}
                      {selectedOptions[option.id] && (
                        <span className="ml-2 font-normal text-muted-foreground">: {selectedOptions[option.id]}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {option.values?.map((optionValue) => {
                        const isSelected = selectedOptions[option.id] === optionValue.value
                        return (
                          <button
                            key={optionValue.id}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.id]: optionValue.value }))}
                            className={cn(
                              "px-4 py-2 text-sm border transition-colors min-w-[48px]",
                              isSelected
                                ? "border-gold text-gold bg-gold/5"
                                : "border-border/50 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                            )}
                          >
                            {optionValue.value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground/70">數量</span>
                <div className="flex items-center border border-border/50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="減少數量"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="增加數量"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={!canAddToCart || adding}
                  onClick={async () => {
                    if (!canAddToCart || !selectedVariant) return
                    setAdding(true)
                    try {
                      await addItem(selectedVariant.id, quantity)
                      toast.success("已加入購物車")
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "加入購物車失敗")
                    } finally {
                      setAdding(false)
                    }
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium tracking-wide transition-colors",
                    canAddToCart && !adding
                      ? "bg-gold text-primary-foreground hover:bg-gold-dark"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {adding ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
                  {isOutOfStock ? "缺貨中" : !selectedVariant && hasOptions ? "請選擇規格" : adding ? "加入中..." : "加入購物車"}
                </button>
                <button
                  className="flex size-12 items-center justify-center border border-border/50 text-muted-foreground hover:text-gold hover:border-gold transition-colors"
                  aria-label="加入收藏"
                >
                  <Heart className="size-4" />
                </button>
                <button
                  className="flex size-12 items-center justify-center border border-border/50 text-muted-foreground hover:text-gold hover:border-gold transition-colors"
                  aria-label="分享"
                >
                  <Share2 className="size-4" />
                </button>
              </div>

              <button
                disabled={!canAddToCart || buyingNow}
                onClick={async () => {
                  if (!canAddToCart || !selectedVariant) return
                  setBuyingNow(true)
                  try {
                    await clearCart()
                    await addItem(selectedVariant.id, quantity)
                    router.push("/checkout")
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "操作失敗")
                    setBuyingNow(false)
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-center gap-2 border border-gold py-3.5 text-sm font-medium tracking-wide transition-all",
                  canAddToCart && !buyingNow
                    ? "text-gold hover:bg-gold hover:text-primary-foreground"
                    : "text-muted-foreground border-muted cursor-not-allowed"
                )}
              >
                {buyingNow ? <Loader2 className="size-4 animate-spin" /> : null}
                {buyingNow ? "處理中..." : "立即購買"}
              </button>
            </div>

          </div>

        </div>

        {/* Brand Story Banner */}
        {displayBrandName && (
          <div className="mt-16 border border-border/30 bg-card p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-1">
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Brand Heritage</p>
                <h2 className="text-xl font-serif font-bold text-foreground">{displayBrandName}</h2>
                {displayBrandNameEn && <p className="mt-1 text-sm text-muted-foreground">{displayBrandNameEn}</p>}
                {brandDescription && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl">{brandDescription}</p>
                )}
              </div>
              <Link
                href={categoryHandle ? `/category/${categoryHandle}` : `/search?brand=${encodeURIComponent(displayBrandName!)}`}
                className="inline-flex items-center gap-2 border border-gold/50 text-gold px-6 py-2.5 text-sm tracking-wide hover:bg-gold hover:text-primary-foreground transition-all shrink-0"
              >
                探索更多 {displayBrandName} 雪茄
              </Link>
            </div>
          </div>
        )}

        {/* Product Tabs */}
        {(product.description || hasSpecs || tastingNotes || pairingNotes) && (
          <div className="mt-12">
            <Tabs defaultValue={(product.description || hasSpecs) ? "description" : "specs"} className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border/30 rounded-none p-0 h-auto gap-0">
                {(product.description || hasSpecs) && (
                  <TabsTrigger
                    value="description"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gold rounded-none px-6 py-3 text-sm"
                  >
                    詳細介紹
                  </TabsTrigger>
                )}
                {tastingNotes && (
                  <TabsTrigger
                    value="tasting"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gold rounded-none px-6 py-3 text-sm"
                  >
                    品鑑筆記
                  </TabsTrigger>
                )}
                {pairingNotes && (
                  <TabsTrigger
                    value="pairing"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gold rounded-none px-6 py-3 text-sm"
                  >
                    配對建議
                  </TabsTrigger>
                )}
              </TabsList>

              {(product.description || hasSpecs) && (
                <TabsContent value="description" className="mt-8">
                  {hasSpecs && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm mb-8 pb-8 border-b border-border/20">
                      {origin && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">產地</span>
                          <span className="text-foreground font-medium">{origin}</span>
                        </div>
                      )}
                      {wrapper && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">茄衣</span>
                          <span className="text-foreground font-medium">{wrapper}</span>
                        </div>
                      )}
                      {binder && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">茄套</span>
                          <span className="text-foreground font-medium">{binder}</span>
                        </div>
                      )}
                      {filler && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">茄芯</span>
                          <span className="text-foreground font-medium">{filler}</span>
                        </div>
                      )}
                      {strength && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">強度</span>
                          <span className="text-foreground font-medium">{strength}</span>
                        </div>
                      )}
                      {cigarLength && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">長度</span>
                          <span className="text-foreground font-medium">{cigarLength}</span>
                        </div>
                      )}
                      {ringGauge && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">環徑</span>
                          <span className="text-foreground font-medium">{ringGauge}</span>
                        </div>
                      )}
                      {packSize && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">包裝</span>
                          <span className="text-foreground font-medium">{packSize} 支裝</span>
                        </div>
                      )}
                      {customAttributes.map((attr) => (
                        <div key={attr.key} className="flex flex-col gap-1">
                          <span className="text-muted-foreground">{attr.key}</span>
                          <span className="text-foreground font-medium">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {product.description && (
                    <div
                      className="max-w-3xl text-sm text-muted-foreground leading-relaxed [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:my-4 [&_ul]:my-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ol]:my-4 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2 [&_li]:leading-relaxed [&_img]:my-6 [&_img]:max-w-full [&_a]:text-gold [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  )}
                </TabsContent>
              )}

              {tastingNotes && (
                <TabsContent value="tasting" className="mt-8">
                  <div className="max-w-2xl">
                    <p className="text-sm text-muted-foreground leading-relaxed">{tastingNotes}</p>
                    {strength && (
                      <div className="mt-8">
                        <p className="text-sm font-medium text-foreground mb-3">強度等級</p>
                        <div className="flex gap-1.5">
                          {(["輕", "中", "中強", "強"] as const).map((level, i) => (
                            <div key={level} className="flex-1 flex flex-col items-center gap-2">
                              <div className={`h-2 w-full ${
                                (strength === "輕" && i === 0) ||
                                (strength === "中" && i <= 1) ||
                                (strength === "中強" && i <= 2) ||
                                (strength === "強")
                                  ? "bg-gold"
                                  : "bg-border/30"
                              }`} />
                              <span className="text-[10px] text-muted-foreground">{level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {pairingNotes && (
                <TabsContent value="pairing" className="mt-8">
                  <div className="max-w-2xl">
                    <p className="text-sm text-muted-foreground leading-relaxed">{pairingNotes}</p>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-serif font-bold text-foreground mb-8">您可能也喜歡</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}