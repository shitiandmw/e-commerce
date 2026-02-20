"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Heart, Share2, ChevronRight } from "lucide-react"
import { type Product } from "@/lib/data/products"
import { useCart } from "@/lib/cart-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product/product-card"

export function ProductDetailContent({
  product,
  relatedProducts,
}: {
  product: Product
  relatedProducts: Product[]
}) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCart((s) => s.addItem)
  const images = product.images || [product.image]

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 py-4 lg:px-6" aria-label="breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-gold transition-colors">首頁</Link></li>
          <li><ChevronRight className="size-3" /></li>
          <li><Link href={`/category/${product.category}`} className="hover:text-gold transition-colors">
            {product.category === "cuban-cigars" ? "古巴雪茄" : product.category === "world-cigars" ? "非古雪茄" : "迷你雪茄"}
          </Link></li>
          <li><ChevronRight className="size-3" /></li>
          <li className="text-foreground/60">{product.name}</li>
        </ol>
      </nav>

      {/* Product Main Section */}
      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
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
                    <Image src={img} alt={`${product.name} - ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Main Image */}
            <div className="relative aspect-square flex-1 overflow-hidden bg-card">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {product.isLimited && (
                <div className="absolute top-4 left-4 bg-gold/90 text-primary-foreground text-xs font-bold px-3 py-1.5 tracking-wider">
                  LIMITED EDITION
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-gold text-xs tracking-[0.3em] uppercase">{product.brandEn}</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">{product.name}</h1>
            <p className="mt-1 text-base text-muted-foreground">{product.nameEn}</p>

            {/* Price */}
            <div className="mt-6 pb-6 border-b border-border/30">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gold">HK${product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground/50 line-through">HK${product.originalPrice.toLocaleString()}</span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{product.packSize} 支裝 / 盒</p>
            </div>

            {/* Description */}
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{product.description}</p>

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
                  onClick={() => addItem(product, quantity)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold text-primary-foreground py-3.5 text-sm font-medium tracking-wide hover:bg-gold-dark transition-colors"
                >
                  <ShoppingBag className="size-4" />
                  加入購物車
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

              <button className="w-full border border-gold text-gold py-3.5 text-sm font-medium tracking-wide hover:bg-gold hover:text-primary-foreground transition-all">
                立即購買
              </button>
            </div>

            {/* Quick Specs */}
            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-border/30 pt-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">產地</span>
                <span className="text-foreground">{product.origin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">強度</span>
                <span className="text-foreground">{product.strength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">長度</span>
                <span className="text-foreground">{product.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">環徑</span>
                <span className="text-foreground">{product.ringGauge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Story Banner */}
        <div className="mt-16 border border-border/30 bg-card p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-1">
              <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Brand Heritage</p>
              <h2 className="text-xl font-serif font-bold text-foreground">{product.brand}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{product.brandEn}</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl">
                {product.brandEn === "Cohiba"
                  ? "高希霸是古巴最負盛名的雪茄品牌，創立於 1966 年，最初僅供古巴政府作為國禮使用。其獨特的雙重發酵工藝造就了無與倫比的順滑口感。"
                  : product.brandEn === "Montecristo"
                  ? "蒙特克里斯托以大仲馬的經典小說命名，自 1935 年創立以來一直是全球最暢銷的古巴雪茄品牌之一。"
                  : `${product.brand}是享譽全球的頂級雪茄品牌，以卓越的製茄工藝和獨特的風味特性著稱。`}
              </p>
            </div>
            <Link
              href={`/category/${product.category}`}
              className="inline-flex items-center gap-2 border border-gold/50 text-gold px-6 py-2.5 text-sm tracking-wide hover:bg-gold hover:text-primary-foreground transition-all shrink-0"
            >
              探索更多 {product.brand} 雪茄
            </Link>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border/30 rounded-none p-0 h-auto gap-0">
              <TabsTrigger
                value="specs"
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gold rounded-none px-6 py-3 text-sm"
              >
                雪茄資料
              </TabsTrigger>
              <TabsTrigger
                value="tasting"
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gold rounded-none px-6 py-3 text-sm"
              >
                品鑑筆記
              </TabsTrigger>
              <TabsTrigger
                value="pairing"
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gold rounded-none px-6 py-3 text-sm"
              >
                配對建議
              </TabsTrigger>
            </TabsList>

            <TabsContent value="specs" className="mt-8">
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
                {[
                  { label: "產地", value: product.origin },
                  { label: "茄衣", value: product.wrapper },
                  { label: "茄套", value: product.binder },
                  { label: "茄芯", value: product.filler },
                  { label: "長度", value: product.length },
                  { label: "環徑", value: product.ringGauge },
                  { label: "強度", value: product.strength },
                  { label: "包裝", value: `${product.packSize} 支裝` },
                ].map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between py-3 border-b border-border/20">
                    <span className="text-sm text-muted-foreground">{spec.label}</span>
                    <span className="text-sm font-medium text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasting" className="mt-8">
              <div className="max-w-2xl">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.tastingNotes || "品鑑筆記即將更新，敬請期待。"}
                </p>
                {/* Strength Meter */}
                <div className="mt-8">
                  <p className="text-sm font-medium text-foreground mb-3">強度等級</p>
                  <div className="flex gap-1.5">
                    {["輕", "中", "中強", "強"].map((level, i) => (
                      <div key={level} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`h-2 w-full ${
                          (product.strength === "輕" && i === 0) ||
                          (product.strength === "中" && i <= 1) ||
                          (product.strength === "中強" && i <= 2) ||
                          (product.strength === "強")
                            ? "bg-gold"
                            : "bg-border/30"
                        }`} />
                        <span className="text-[10px] text-muted-foreground">{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pairing" className="mt-8">
              <div className="max-w-2xl">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.pairingNotes || "配對建議即將更新，敬請期待。"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

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
