import Link from "next/link"

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
      <p className="mb-6 text-lg text-muted">商品未找到</p>
      <Link
        href="/products"
        className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
      >
        浏览全部商品
      </Link>
    </div>
  )
}
