"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Shield, RotateCcw, Loader2 } from "lucide-react"
import { useCart, selectTotalItems, selectTotalPrice, getCartProductName, getCartProductImage } from "@/lib/cart-store"
import { useTranslations, useLocale } from "next-intl"
import type { CartLineItem } from "@/lib/cart"
import type { MedusaProduct } from "@/lib/data/products"
import { getMedusaPrice, getMedusaImages } from "@/lib/data/products"
import { formatPrice } from "@/lib/format"

function CartItemRow({ item, currencyCode }: { item: CartLineItem; currencyCode?: string }) {
  const { updateItem, removeItem, loading } = useCart()
  const t = useTranslations()
  const productName = getCartProductName(item)
  const productImage = getCartProductImage(item)
  const productLink = item.variant?.product?.handle
    ? `/product/${item.variant.product.handle}`
    : "#"
  const variantLabel = item.variant_title || item.variant?.title

  return (
    <div className="flex gap-4 py-6 border-b border-border/30 last:border-b-0">
      <Link href={productLink} className="shrink-0">
        <div className="relative size-24 sm:size-28 bg-secondary/30 overflow-hidden">
          <Image src={productImage} alt={productName} fill className="object-cover hover:scale-105 transition-transform duration-300" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={productLink} className="text-sm font-medium text-foreground hover:text-gold transition-colors line-clamp-2 leading-snug">
              {productName}
            </Link>
            {variantLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">{variantLabel}</p>
            )}
          </div>
          <button
            onClick={() => removeItem(item.id)}
            disabled={loading}
            className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
            aria-label={t("remove")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-end justify-between mt-auto pt-3">
          <div className="flex items-center border border-border/50">
            <button
              onClick={() => updateItem(item.id, item.quantity - 1)}
              disabled={loading}
              className="flex items-center justify-center size-8 text-foreground/60 hover:text-gold hover:bg-secondary/30 transition-colors disabled:opacity-50"
              aria-label={t("decrease_quantity")}
            >
              <Minus className="size-3" />
            </button>
            <span className="flex items-center justify-center w-10 h-8 text-xs font-medium text-foreground border-x border-border/50">
              {item.quantity}
            </span>
            <button
              onClick={() => updateItem(item.id, item.quantity + 1)}
              disabled={loading}
              className="flex items-center justify-center size-8 text-foreground/60 hover:text-gold hover:bg-secondary/30 transition-colors disabled:opacity-50"
              aria-label={t("increase_quantity")}
            >
              <Plus className="size-3" />
            </button>
          </div>

          <div className="text-right">
            {item.quantity > 1 && (
              <p className="text-[10px] text-muted-foreground">
                {formatPrice(item.unit_price, currencyCode)} x {item.quantity}
              </p>
            )}
            <p className="text-gold font-bold">
              {formatPrice(item.total, currencyCode)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
function EmptyCart() {
  const t = useTranslations()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="size-20 flex items-center justify-center rounded-full bg-secondary/50 mb-6">
        <ShoppingBag className="size-8 text-muted-foreground/50" />
      </div>
      <h2 className="text-xl font-serif text-foreground mb-2">{t("empty_cart")}</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        {t("empty_cart_description")}
      </p>
      <Link
        href="/category/cuban-cigars"
        className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
      >
        {t("explore_cigars")}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}

function RecommendedProducts() {
  const t = useTranslations()
  const locale = useLocale()
  const [products, setProducts] = useState<MedusaProduct[]>([])

  useEffect(() => {
    fetch(`/api/products?limit=4&order=-created_at&fields=id,title,handle,thumbnail,*variants,*variants.prices,*brand&locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
  }, [locale])

  if (products.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-border/30">
      <h3 className="text-lg font-serif text-foreground mb-6">{t("you_may_also_like")}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const price = getMedusaPrice(product)
          const image = getMedusaImages(product)[0] || product.thumbnail || "/images/placeholder.jpg"
          const brand = Array.isArray(product.brand) ? product.brand[0] : product.brand
          return (
            <Link key={product.id} href={`/product/${product.handle}`} className="group">
              <div className="relative aspect-square bg-secondary/30 overflow-hidden mb-3">
                <Image src={image} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              {brand?.name && (
                <p className="text-[10px] text-gold tracking-[0.15em] uppercase">{brand.name}</p>
              )}
              <p className="text-xs text-foreground mt-0.5 line-clamp-1 group-hover:text-gold transition-colors">{product.title}</p>
              {price && (
                <p className="text-xs text-gold font-medium mt-1">
                  {formatPrice(price.amount, price.currency_code)}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
export default function CartPage() {
  const { cart, loading, initCart, clear } = useCart()
  const t = useTranslations()
  const itemCount = useCart(selectTotalItems)
  const subtotal = useCart(selectTotalPrice)
  const currencyCode = cart?.currency_code
  const items = cart?.items ?? []
  const freeShippingThreshold = 200000 // in cents ($2000)
  const shippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100)
  const shippingRemaining = Math.max(freeShippingThreshold - subtotal, 0)

  useEffect(() => {
    initCart()
  }, [initCart])

  if (loading && !cart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 lg:px-6 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-gold" />
      </div>
    )
  }

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
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <Link href="/" className="hover:text-gold transition-colors">{t("home")}</Link>
        <span className="text-border">/</span>
        <span className="text-foreground">{t("cart")} ({itemCount})</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-serif text-foreground">{t("cart")}</h1>
            <button
              onClick={() => clear()}
              disabled={loading}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              {t("clear_cart")}
            </button>
          </div>
          {subtotal < freeShippingThreshold && (
            <div className="mb-6 p-4 bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <Truck className="size-3.5 text-gold" />
                  <span>{t("free_shipping_remaining", { amount: formatPrice(shippingRemaining, currencyCode) })}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(shippingProgress)}%</span>
              </div>
              <div className="h-1 bg-border/50 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${shippingProgress}%` }} />
              </div>
            </div>
          )}

          <div>
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} currencyCode={currencyCode} />
            ))}
          </div>
        </div>

        <div className="lg:w-[380px] shrink-0">
          <div className="sticky top-24 bg-card border border-border/30 p-6">
            <h2 className="text-sm font-medium text-foreground mb-6 tracking-wide">{t("order_summary")}</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")} ({itemCount} {t("items")})</span>
                <span className="text-foreground">{formatPrice(subtotal, currencyCode)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className={subtotal >= freeShippingThreshold ? "text-gold" : "text-foreground"}>
                  {subtotal >= freeShippingThreshold ? t("free_shipping") : t("calculated_at_checkout")}
                </span>
              </div>
            </div>

            <div className="border-t border-border/30 mt-4 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-foreground">{t("total")}</span>
                <span className="text-xl font-bold text-gold">{formatPrice(subtotal, currencyCode)}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("promo_code")}
                  className="flex-1 h-9 bg-background border border-border/50 px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
                />
                <button className="h-9 px-4 text-xs font-medium bg-secondary text-foreground/70 hover:text-gold border border-border/50 hover:border-gold/30 transition-colors">
                  {t("apply")}
                </button>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gold text-primary-foreground h-12 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
            >
              {t("proceed_to_checkout")}
              <ArrowRight className="size-4" />
            </Link>

            <div className="mt-6 pt-5 border-t border-border/20 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Shield className="size-4 text-gold/60 shrink-0" />
                <span>SSL {t("secure_payment")}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Truck className="size-4 text-gold/60 shrink-0" />
                <span>{t("global_shipping")}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <RotateCcw className="size-4 text-gold/60 shrink-0" />
                <span>{t("return_policy")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecommendedProducts />
    </div>
  )
}