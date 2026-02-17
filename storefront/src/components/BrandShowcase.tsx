import Image from "next/image"
import Link from "next/link"

interface Brand {
  id: string
  name: string
  description?: string
  logo_url?: string
}

export default function BrandShowcase({ brands }: { brands: Brand[] }) {
  if (!brands || brands.length === 0) return null

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gold">品牌精选</h2>
            <p className="text-sm text-muted">
              探索来自全球的优质雪茄品牌
            </p>
          </div>
          <Link
            href="/brands"
            className="text-sm text-gold transition-colors hover:text-gold-light"
          >
            查看全部 &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="group flex flex-col items-center gap-2 rounded-lg bg-background p-3 transition hover:ring-1 hover:ring-gold/30"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-surface-light transition-transform duration-300 group-hover:scale-110">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xl font-bold text-gold">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-center text-xs font-medium text-foreground transition-colors group-hover:text-gold">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
