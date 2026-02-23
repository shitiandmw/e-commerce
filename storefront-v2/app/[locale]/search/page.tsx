import { Link } from "@/i18n/navigation"
import { Search } from "lucide-react"
import { fetchProducts, type MedusaProductListResponse } from "@/lib/data/products"
import { getRegion } from "@/lib/region"
import { ProductCard } from "@/components/product/product-card"
import { getTranslations } from "next-intl/server"

const PAGE_SIZE = 12

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const t = await getTranslations()
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ""
  const currentPage = parseInt(resolvedSearchParams.page || "1", 10)
  const offset = (currentPage - 1) * PAGE_SIZE

  let data: MedusaProductListResponse = { products: [], count: 0, offset: 0, limit: PAGE_SIZE }

  if (query) {
    const region = await getRegion()
    data = await fetchProducts({ q: query, limit: PAGE_SIZE, offset, locale, region_id: region.id })
  }

  const totalPages = Math.ceil(data.count / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gold font-serif">{t("search_title")}</h1>

      {/* Search form */}
      <form action="/search" method="GET" className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={t("search_placeholder")}
              className="w-full rounded-md border border-border/50 bg-card pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90"
          >
            {t("search")}
          </button>
        </div>
      </form>
      {/* Results */}
      {query ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {data.count > 0
              ? t("search_found_count", { count: data.count })
              : t("search_not_found", { query })}
          </p>

          {data.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="mb-2 text-lg text-muted-foreground">{t("no_results")}</p>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("search_alt_hint")}
              </p>
              <Link
                href="/category/all"
                className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90"
              >
                {t("browse_all")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                  className="rounded-md border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors"
                >
                  {t("prev_page")}
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/search?q=${encodeURIComponent(query)}&page=${page}`}
                  className={`rounded-md px-4 py-2 text-sm transition-colors ${
                    page === currentPage
                      ? "bg-gold text-primary-foreground"
                      : "border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/30"
                  }`}
                >
                  {page}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                  className="rounded-md border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors"
                >
                  {t("next_page")}
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="size-12 text-muted-foreground/30 mb-4" />
          <p className="mb-2 text-lg text-muted-foreground">{t("search_empty_hint")}</p>
          <p className="text-sm text-muted-foreground/70">{t("search_lang_support")}</p>
        </div>
      )}
    </div>
  )
}
