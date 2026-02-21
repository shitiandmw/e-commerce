"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, Heart } from "lucide-react"
import { type Product } from "@/lib/data/products"
import { useCart } from "@/lib/cart-store"

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem)

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
            <span className="bg-gold/90 text-primary-foreground text-[10px] font-bold px-2 py-1 tracking-wider">
              LIMITED
            </span>
          )}
          {product.isNew && (
            <span className="bg-foreground/80 text-background text-[10px] font-bold px-2 py-1 tracking-wider">
              NEW
            </span>
          )}
        </div>
        <button
          className="absolute top-3 right-3 size-8 flex items-center justify-center bg-background/50 backdrop-blur-sm text-foreground/50 hover:text-gold opacity-0 group-hover:opacity-100 transition-all"
          aria-label="加入收藏"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="size-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            className="w-full flex items-center justify-center gap-2 bg-gold/90 text-primary-foreground py-3 text-xs font-medium tracking-wide hover:bg-gold transition-colors"
            onClick={(e) => {
              e.preventDefault()
              addItem(product)
            }}
          >
            <ShoppingBag className="size-3.5" />
            加入購物車
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] text-gold tracking-[0.15em] uppercase">{product.brandEn}</p>
        <h3 className="mt-1 text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{product.nameEn}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-gold font-bold">HK${product.price.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground/60">{product.packSize} 支裝</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${product.inStock ? "bg-green-500" : "bg-destructive"}`} />
          <span className="text-[10px] text-muted-foreground">{product.inStock ? "有貨" : "缺貨"}</span>
        </div>
      </div>
    </Link>
  )
}
