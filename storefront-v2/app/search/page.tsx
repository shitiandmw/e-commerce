import Link from "next/link"
import { Search } from "lucide-react"
import { fetchProducts, type MedusaProductListResponse } from "@/lib/data/products"
import { ProductCard } from "@/components/product/product-card"

const PAGE_SIZE = 12

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const query = params.q || ""
  const currentPage = parseInt(params.page || "1", 10)
  const offset = (currentPage - 1) * PAGE_SIZE

  let data: MedusaProductListResponse = { products: [], count: 0, offset: 0, limit: PAGE_SIZE }

  if (query) {
    data = await fetchProducts({ q: query, limit: PAGE_SIZE, offset })
  }

  const totalPages = Math.ceil(data.count / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-6">
      <h1 className="mb-8 text-3xl font-bold text-gold font-serif">搜尋</h1>

      {/* Search form */}
      <form action="/search" method="GET" className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="搜尋商品..."
              className="w-full rounded-md border border-border/50 bg-card pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90"
          >
            搜尋
          </button>
        </div>
      </form>
      {/* Results */}
      {query ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {data.count > 0
              ? `找到 ${data.count} 個與「${query}」相關的商品`
              : `未找到與「${query}」相關的商品`}
          </p>

          {data.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="mb-2 text-lg text-muted-foreground">沒有找到相關商品</p>
              <p className="mb-6 text-sm text-muted-foreground">
                試試其他關鍵詞，或瀏覽我們的商品目錄
              </p>
              <Link
                href="/category/all"
                className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold/90"
              >
                瀏覽全部商品
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
                  上一頁
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
                  下一頁
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="size-12 text-muted-foreground/30 mb-4" />
          <p className="mb-2 text-lg text-muted-foreground">輸入關鍵詞開始搜尋</p>
          <p className="text-sm text-muted-foreground/70">支持中文和英文搜尋</p>
        </div>
      )}
    </div>
  )
}
