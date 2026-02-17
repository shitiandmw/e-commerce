import Link from "next/link"
import { fetchContent } from "@/lib/api"

interface Product {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  variants?: Array<{
    calculated_price?: {
      calculated_amount?: number
      currency_code?: string
    }
  }>
}

interface ProductsResponse {
  products: Product[]
  count: number
  offset: number
  limit: number
}

const PAGE_SIZE = 12

function formatPrice(amount: number | undefined, currency: string | undefined) {
  if (amount === undefined) return ""
  const code = currency || "cny"
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: code.toUpperCase(),
  }).format(amount / 100)
}

export default async function SearchPage({
  params: paramsPromise,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { locale } = await paramsPromise
  const params = await searchParams
  const query = params.q || ""
  const currentPage = parseInt(params.page || "1", 10)
  const offset = (currentPage - 1) * PAGE_SIZE

  let data: ProductsResponse = { products: [], count: 0, offset: 0, limit: PAGE_SIZE }

  if (query) {
    try {
      const MEDUSA_BACKEND_URL =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const url = new URL(`${MEDUSA_BACKEND_URL}/store/products`)
      url.searchParams.set("q", query)
      url.searchParams.set("offset", String(offset))
      url.searchParams.set("limit", String(PAGE_SIZE))
      url.searchParams.set("fields", "+variants.calculated_price")

      const res = await fetch(url.toString(), {
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        next: { revalidate: 0 },
      })
      if (res.ok) {
        data = await res.json()
      }
    } catch {
      // ignore
    }
  }

  const totalPages = Math.ceil(data.count / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gold">搜索</h1>

      {/* Search form */}
      <form action={`/${locale}/search`} method="GET" className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="搜索商品..."
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
          >
            搜索
          </button>
        </div>
      </form>

      {/* Results */}
      {query ? (
        <>
          <p className="mb-6 text-sm text-muted">
            {data.count > 0
              ? `找到 ${data.count} 个与"${query}"相关的商品`
              : `未找到与"${query}"相关的商品`}
          </p>

          {data.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="mb-2 text-lg text-muted">没有找到相关商品</p>
              <p className="mb-6 text-sm text-muted">
                试试其他关键词，或浏览我们的商品目录
              </p>
              <Link
                href={`/${locale}/products`}
                className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
              >
                浏览全部商品
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.products.map((product) => {
                const price = product.variants?.[0]?.calculated_price
                return (
                  <Link
                    key={product.id}
                    href={`/${locale}/products/${product.handle}`}
                    className="group overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/30"
                  >
                    {product.thumbnail ? (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-surface-light">
                        <span className="text-4xl text-muted/30">📦</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="mb-1 text-sm font-medium text-foreground group-hover:text-gold transition-colors">
                        {product.title}
                      </h3>
                      {price && (
                        <p className="text-sm text-gold">
                          {formatPrice(price.calculated_amount, price.currency_code)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/${locale}/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                  className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-gold"
                >
                  上一页
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/${locale}/search?q=${encodeURIComponent(query)}&page=${page}`}
                  className={`rounded px-4 py-2 text-sm ${
                    page === currentPage
                      ? "bg-gold text-background"
                      : "border border-border text-muted hover:text-gold"
                  }`}
                >
                  {page}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link
                  href={`/${locale}/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                  className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-gold"
                >
                  下一页
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mb-2 text-lg text-muted">输入关键词开始搜索</p>
          <p className="text-sm text-muted">支持中文和英文搜索</p>
        </div>
      )}
    </div>
  )
}
