import Link from "next/link"
import Image from "next/image"

interface ProductCardProps {
  product: {
    id: string
    title: string
    handle: string
    thumbnail: string | null
    variants?: {
      prices?: {
        amount: number
        currency_code: string
      }[]
    }[]
    brand?: { name: string } | null
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = product.variants?.[0]?.prices?.[0]
  const brandName = product.brand?.name

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/50"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-light">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        {brandName && (
          <p className="mb-1 text-xs text-gold">{brandName}</p>
        )}
        <h3 className="mb-1 text-sm font-medium text-foreground line-clamp-2 group-hover:text-gold transition-colors">
          {product.title}
        </h3>
        {price && (
          <p className="text-sm font-semibold text-gold">
            {price.currency_code.toUpperCase()} {price.amount}
          </p>
        )}
      </div>
    </Link>
  )
}
