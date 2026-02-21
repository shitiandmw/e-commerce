"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Shield, RotateCcw } from "lucide-react"
import { useCart, type CartItem } from "@/lib/cart-store"
import { products } from "@/lib/data/products"

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex gap-4 py-6 border-b border-border/30 last:border-b-0">
      {/* product image */}
      <Link href={`/product/${item.product.id}`} className="shrink-0">
        <div className="relative size-24 sm:size-28 bg-secondary/30 overflow-hidden">
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* info */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-gold tracking-[0.15em] uppercase">{item.product.brandEn}</p>
            <Link href={`/product/${item.product.id}`} className="text-sm font-medium text-foreground hover:text-gold transition-colors line-clamp-2 leading-snug mt-0.5">
              {item.product.name}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">{item.product.nameEn}</p>
          </div>
          <button
            onClick={() => removeItem(item.product.id)}
            className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
            aria-label="移除商品"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-end justify-between mt-auto pt-3">
          {/* quantity controls */}
          <div className="flex items-center border border-border/50">
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              className="flex items-center justify-center size-8 text-foreground/60 hover:text-gold hover:bg-secondary/30 transition-colors"
              aria-label="減少數量"
            >
              <Minus className="size-3" />
            </button>
            <span className="flex items-center justify-center w-10 h-8 text-xs font-medium text-foreground border-x border-border/50">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              className="flex items-center justify-center size-8 text-foreground/60 hover:text-gold hover:bg-secondary/30 transition-colors"
              aria-label="增加數量"
            >
              <Plus className="size-3" />
            </button>
          </div>

          {/* price */}
          <div className="text-right">
            {item.quantity > 1 && (
              <p className="text-[10px] text-muted-foreground">
                HK${item.product.price.toLocaleString()} x {item.quantity}
              </p>
            )}
            <p className="text-gold font-bold">
              HK${(item.product.price * item.quantity).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="size-20 flex items-center justify-center rounded-full bg-secondary/50 mb-6">
        <ShoppingBag className="size-8 text-muted-foreground/50" />
      </div>
      <h2 className="text-xl font-serif text-foreground mb-2">您的購物車是空的</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        瀏覽我們的精選雪茄系列，開始您的品鑑之旅。
      </p>
      <Link
        href="/category/cuban-cigars"
        className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
      >
        探索雪茄
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}

function RecommendedProducts() {
  const featured = products.filter((p) => p.isFeatured).slice(0, 4)
  return (
    <section className="mt-16 pt-12 border-t border-border/30">
      <h3 className="text-lg font-serif text-foreground mb-6">您可能也喜歡</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featured.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group"
          >
            <div className="relative aspect-square bg-secondary/30 overflow-hidden mb-3">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-[10px] text-gold tracking-[0.15em] uppercase">{product.brandEn}</p>
            <p className="text-xs text-foreground mt-0.5 line-clamp-1 group-hover:text-gold transition-colors">{product.name}</p>
            <p className="text-xs text-gold font-medium mt-1">HK${product.price.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function CartPage() {
  const { items, clearCart } = useCart()
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const freeShippingThreshold = 2000
  const shippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100)
  const shippingRemaining = Math.max(freeShippingThreshold - subtotal, 0)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <EmptyCart />
        <RecommendedProducts />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12 lg:px-6">
      {/* breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <Link href="/" className="hover:text-gold transition-colors">首頁</Link>
        <span className="text-border">/</span>
        <span className="text-foreground">購物車 ({itemCount})</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* left: cart items */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-serif text-foreground">購物車</h1>
            <button
              onClick={clearCart}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              清空購物車
            </button>
          </div>

          {/* free shipping bar */}
          {subtotal < freeShippingThreshold && (
            <div className="mb-6 p-4 bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Truck className="size-3.5 text-gold" />
                  <span>再消費 <span className="text-gold font-medium">HK${shippingRemaining.toLocaleString()}</span> 即享免運費</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(shippingProgress)}%</span>
              </div>
              <div className="h-1 bg-border/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all duration-500"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* items list */}
          <div>
            {items.map((item) => (
              <CartItemRow key={item.product.id} item={item} />
            ))}
          </div>
        </div>

        {/* right: order summary */}
        <div className="lg:w-[380px] shrink-0">
          <div className="sticky top-24 bg-card border border-border/30 p-6">
            <h2 className="text-sm font-medium text-foreground mb-6 tracking-wide">訂單摘要</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">小計 ({itemCount} 件商品)</span>
                <span className="text-foreground">HK${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">運費</span>
                <span className={subtotal >= freeShippingThreshold ? "text-gold" : "text-foreground"}>
                  {subtotal >= freeShippingThreshold ? "免運費" : "結帳時計算"}
                </span>
              </div>
            </div>

            <div className="border-t border-border/30 mt-4 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-foreground">總計</span>
                <span className="text-xl font-bold text-gold">HK${subtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* promo code */}
            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="優惠碼"
                  className="flex-1 h-9 bg-background border border-border/50 px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
                />
                <button className="h-9 px-4 text-xs font-medium bg-secondary text-foreground/70 hover:text-gold border border-border/50 hover:border-gold/30 transition-colors">
                  套用
                </button>
              </div>
            </div>

            {/* checkout button */}
            <Link
              href="/checkout"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gold text-primary-foreground h-12 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
            >
              前往結帳
              <ArrowRight className="size-4" />
            </Link>

            {/* trust badges */}
            <div className="mt-6 pt-5 border-t border-border/20 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Shield className="size-4 text-gold/60 shrink-0" />
                <span>SSL 安全加密付款</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Truck className="size-4 text-gold/60 shrink-0" />
                <span>全球配送，專業包裝保護</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <RotateCcw className="size-4 text-gold/60 shrink-0" />
                <span>7 天無理由退換</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecommendedProducts />
    </div>
  )
}
