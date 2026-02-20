import Image from "next/image"
import Link from "next/link"

interface Brand {
  id: string
  name: string
  name_zh?: string
  description?: string
  logo_url?: string
}

export default function BrandShowcase({
  brands,
  locale,
  dict,
}: {
  brands: Brand[]
  locale: string
  dict: Record<string, string>
}) {
  if (!brands || brands.length === 0) return null

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gold">{dict.brand_showcase_title || "品牌精选"}</h2>
            <p className="text-sm text-muted">
              {dict.brand_showcase_desc || "探索来自全球的优质雪茄品牌"}
            </p>
          </div>
          <Link
            href={`/${locale}/brands`}
            className="text-sm text-gold transition-colors hover:text-gold-light"
          >
            {dict.view_all || "查看全部"} &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/${locale}/brands/${brand.id}`}
              className="group flex flex-col items-center gap-2 rounded-lg border border-transparent bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-surface-light">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-xl font-bold text-gold">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              {brand.name_zh && (
                <span className="text-center text-xs font-medium text-foreground transition-colors group-hover:text-gold">
                  {brand.name_zh}
                </span>
              )}
              <span className="text-center text-[11px] text-muted">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
