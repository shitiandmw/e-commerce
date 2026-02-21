import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { CollectionProductWithPrice } from "@/lib/data/collections"

interface LimitedEditionsProps {
  products: CollectionProductWithPrice[]
}

export function LimitedEditions({ products }: LimitedEditionsProps) {
  if (products.length === 0) return null

  return (
    <section className="py-16 px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Limited Edition</p>
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-foreground leading-tight text-balance">
              限量珍藏版
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
              每年僅生產極少數量的珍藏版雪茄，融合了品牌最頂尖的製茄工藝與最珍貴的陳年菸葉。一經售罄，便不再重現。
            </p>
            <Link
              href="/category/cuban-cigars"
              className="mt-8 inline-flex items-center gap-2 border border-gold text-gold px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold hover:text-primary-foreground transition-all"
            >
              探索限量版 <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Right: Cards */}
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 2).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.handle}`}
                className="group relative overflow-hidden bg-card border border-border/30 hover:border-gold/30 transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute top-3 left-3 bg-gold/90 text-primary-foreground text-[10px] font-bold px-2 py-1 tracking-wider">
                    LIMITED
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="mt-1 text-sm font-serif font-medium text-foreground">{product.title}</h3>
                    {product.price !== null ? (
                      <p className="mt-2 text-gold font-bold text-sm">HK${product.price.toLocaleString()}</p>
                    ) : (
                      <p className="mt-2 text-muted-foreground text-xs">價格待定</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
