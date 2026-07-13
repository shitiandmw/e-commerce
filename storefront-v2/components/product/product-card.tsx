"use client"

import { useState } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ShoppingBag, Heart, Loader2 } from "lucide-react"
import { type Product, type MedusaProduct, getMedusaPrice } from "@/lib/data/products"
import { formatPrice } from "@/lib/format"
import { useCart } from "@/lib/cart-store"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { getCustomTags, ProductTagChip } from "@/components/product/product-tag-chip"
import { isProductOutOfStock } from "@/lib/product-availability"

function isMedusaProduct(p: Product | MedusaProduct): p is MedusaProduct {
  return "handle" in p && "variants" in p
}

export function ProductCard({ product }: { product: Product | MedusaProduct }) {
  const addItem = useCart((s) => s.addItem)

  if (isMedusaProduct(product)) {
    return <MedusaProductCard product={product} addItem={addItem} />
  }

  return <MockProductCard product={product} />
}

function MedusaProductCard({
  product,
  addItem,
}: {
  product: MedusaProduct
  addItem: (variantId: string, qty?: number) => Promise<void>
}) {
  const t = useTranslations()
  const [adding, setAdding] = useState(false)
  const priceInfo = getMedusaPrice(product)
  const meta = (product.metadata ?? {}) as Record<string, string | undefined>
  const isLimited = meta.is_limited === "true"
  const brandObj = Array.isArray(product.brand) ? product.brand[0] : product.brand
  const brandNameEn = brandObj?.name ?? meta.brand_name_en
  const firstVariant = product.variants?.[0]
  const hasSingleVariant = (product.variants?.length ?? 0) === 1
  const firstVariantId = firstVariant?.id
  const isOutOfStock = isProductOutOfStock(product)
  const canQuickAdd = hasSingleVariant && !!firstVariantId && !isOutOfStock
  const customTags = getCustomTags(product)
  const badgeTags = customTags.filter((tag) => tag.type === "badge")
  const attributeTags = customTags.filter((tag) => tag.type === "attribute").slice(0, 2)
  const visibleBadgeTags = badgeTags.slice(0, isLimited ? 1 : 2)

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!firstVariantId || adding) return
    setAdding(true)
    try {
      await addItem(firstVariantId)
      toast.success(t("added_to_cart"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("add_to_cart_failed"))
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link
      href={`/product/${product.handle}`}
      className="group bg-card border border-border/30 hover:border-gold/30 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.thumbnail || "/images/placeholder.jpg"}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {(isLimited || visibleBadgeTags.length > 0) && (
          <div className="absolute top-3 left-3 right-12 flex flex-wrap items-start gap-1.5">
            {isLimited && (
              <span className="bg-gold/90 text-primary-foreground text-[0.625rem] font-bold px-2 py-1 tracking-wider">
                LIMITED
              </span>
            )}
            {visibleBadgeTags.map((tag) => (
              <ProductTagChip key={tag.id} tag={tag} variant="badge" />
            ))}
          </div>
        )}
        <button
          className="absolute top-3 right-3 size-8 flex items-center justify-center bg-background/50 backdrop-blur-sm text-foreground/50 hover:text-gold opacity-0 group-hover:opacity-100 transition-all"
          aria-label={t("add_to_wishlist")}
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="size-4" />
        </button>
        {canQuickAdd && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              className="w-full flex items-center justify-center gap-2 bg-gold/90 text-primary-foreground py-3 text-xs font-medium tracking-wide hover:bg-gold transition-colors disabled:opacity-70"
              onClick={handleQuickAdd}
              disabled={adding}
            >
              {adding ? <Loader2 className="size-3.5 animate-spin" /> : <ShoppingBag className="size-3.5" />}
              {adding ? t("adding_to_cart") : t("add_to_cart")}
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        {brandNameEn && (
          <p className="text-[0.625rem] text-gold tracking-[0.15em] uppercase">{brandNameEn}</p>
        )}
        <h3 className="mt-1 text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {product.title}
        </h3>
        {product.subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{product.subtitle}</p>
        )}
        {attributeTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {attributeTags.map((tag) => (
              <ProductTagChip key={tag.id} tag={tag} variant="attribute" />
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          {priceInfo ? (
            <span className="text-gold font-bold">
              {formatPrice(priceInfo.amount, priceInfo.currency_code)}
            </span>
          ) : (
            <span className="text-muted-foreground font-bold">{t("price_tbd")}</span>
          )}
          {isOutOfStock && (
            <span className="text-[0.625rem] text-destructive font-medium">{t("out_of_stock")}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function MockProductCard({
  product,
}: {
  product: Product
}) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group bg-card border border-border/30 hover:border-gold/30 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isLimited && (
            <span className="bg-gold/90 text-primary-foreground text-[0.625rem] font-bold px-2 py-1 tracking-wider">
              LIMITED
            </span>
          )}
          {product.isNew && (
            <span className="bg-foreground/80 text-background text-[0.625rem] font-bold px-2 py-1 tracking-wider">
              NEW
            </span>
          )}
        </div>
        <button
          className="absolute top-3 right-3 size-8 flex items-center justify-center bg-background/50 backdrop-blur-sm text-foreground/50 hover:text-gold opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="size-4" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-[0.625rem] text-gold tracking-[0.15em] uppercase">{product.brandEn}</p>
        <h3 className="mt-1 text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{product.nameEn}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-gold font-bold">${product.price.toLocaleString()}</span>
          <span className="text-[0.625rem] text-muted-foreground/60">{product.packSize}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${product.inStock ? "bg-green-500" : "bg-destructive"}`} />
          <span className="text-[0.625rem] text-muted-foreground">{product.inStock ? "✓" : "✗"}</span>
        </div>
      </div>
    </Link>
  )
}
