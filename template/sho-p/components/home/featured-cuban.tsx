import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getFeaturedProducts } from "@/lib/data/products"

export function FeaturedCuban() {
  const featured = getFeaturedProducts().slice(0, 3)

  return (
    <section className="py-16 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Featured Selection</p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">古巴雪茄焦點推介</h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            精選古巴最頂級的雪茄品牌，每一支都是大師級工藝的結晶
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featured.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group relative overflow-hidden"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-gold text-xs tracking-[0.2em] uppercase">{product.brandEn}</p>
                  <h3 className="mt-2 text-lg font-serif font-bold text-foreground">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.nameEn}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-gold font-bold">HK${product.price.toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-xs text-foreground/60 group-hover:text-gold transition-colors">
                      了解更多 <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/category/cuban-cigars"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors tracking-wide"
          >
            探索全部古巴雪茄 <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
