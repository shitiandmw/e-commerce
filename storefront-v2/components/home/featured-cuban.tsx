import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ArrowRight } from "lucide-react"
import type { CollectionProductWithPrice } from "@/lib/data/collections"
import { getTranslations } from "next-intl/server"

interface FeaturedCubanProps {
  products: CollectionProductWithPrice[]
}

export async function FeaturedCuban({ products }: FeaturedCubanProps) {
  const t = await getTranslations()
  if (products.length === 0) return null

  return (
    <section className="py-16 px-4 lg:px-6 bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Featured Selection</p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{t("featured_cuban_title")}</h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {t("featured_cuban_desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {products.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.handle}`}
              className="group relative overflow-hidden"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="mt-2 text-lg font-serif font-bold text-foreground">{product.title}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    {product.price !== null ? (
                      <span className="text-gold font-bold">HK${product.price.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("price_tbd")}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-foreground/60 group-hover:text-gold transition-colors">
                      {t("view_more")} <ArrowRight className="size-3" />
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
            {t("browse_all")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
