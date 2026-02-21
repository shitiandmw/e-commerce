"use client"

import Image from "next/image"
import Link from "next/link"
import { products } from "@/lib/data/products"
import { ShoppingBag, Flame } from "lucide-react"
import { useCart } from "@/lib/cart-store"

export function HotPicks() {
  const hotProducts = products.slice(0, 4)
  const addItem = useCart((s) => s.addItem)

  return (
    <section className="py-16 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Hot Picks</p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground text-balance">炙热单品</h2>
          </div>
          <Link
            href="/category/cuban-cigars"
            className="text-xs text-muted-foreground hover:text-gold transition-colors tracking-wide"
          >
            查看更多 &rarr;
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {hotProducts.map((product) => (
            <Link
              key={product.id}
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
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-gold/90 text-primary-foreground text-[10px] font-bold px-2 py-1 tracking-wider">
                  <Flame className="size-3" />
                  HOT
                </div>
                {/* Quick add overlay */}
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
                <p className="text-[10px] text-gold tracking-wider uppercase">{product.brandEn}</p>
                <h3 className="mt-1 text-sm font-medium text-foreground leading-snug line-clamp-2">{product.name}</h3>
                <div className="mt-3">
                  <span className="text-gold font-bold text-base">HK${product.price.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
