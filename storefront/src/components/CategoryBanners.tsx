import Link from "next/link"

interface BannerItem {
  id: string
  image_url: string
  title?: string
  subtitle?: string
  link_url?: string
  sort_order: number
}

interface BannerSlot {
  id: string
  name: string
  key: string
  items: BannerItem[]
}

export default function CategoryBanners({ banners, dict }: { banners: BannerSlot[]; dict: Record<string, string> }) {
  // Find the home_category slot
  const slot = banners.find((s) => s.key === "home_category")
  const items = slot?.items || []

  if (items.length === 0) return null

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-2 text-center text-2xl font-bold text-gold">{dict.category_banners_title || "精选分类"}</h2>
        <p className="mb-10 text-center text-sm text-muted">
          {dict.category_banners_desc || "探索不同系列，找到您的心仪之选"}
        </p>
        <div
          className={`grid gap-4 ${
            items.length <= 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.link_url || "/products"}
              className="group relative block overflow-hidden rounded-lg"
            >
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={item.image_url}
                  alt={item.title || "分类横幅"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                {item.title && (
                  <h3 className="mb-1 text-lg font-bold text-white">
                    {item.title}
                  </h3>
                )}
                {item.subtitle && (
                  <p className="mb-3 text-sm text-white/80">{item.subtitle}</p>
                )}
                <span className="inline-block rounded bg-gold px-4 py-1.5 text-xs font-semibold text-background transition-colors group-hover:bg-gold-light">
                  {dict.shop_now || "立即选购"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
