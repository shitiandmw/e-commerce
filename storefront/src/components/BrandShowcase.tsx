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
        <h2 className="mb-2 text-center text-2xl font-bold text-gold">品牌精选</h2>
        <p className="mb-10 text-center text-sm text-muted">
          探索来自全球的优质雪茄品牌
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="group flex flex-col items-center gap-3 rounded-lg bg-background p-4 transition hover:ring-1 hover:ring-gold/30"
            >
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-light">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gold">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-center text-sm font-medium text-foreground group-hover:text-gold">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
