"use client"

import Image from "next/image"
import Link from "next/link"
import { useCompare } from "./CompareProvider"

export default function CompareBar() {
  const { items, count, removeFromCompare, clearCompare } = useCompare()

  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Product thumbnails */}
        <div className="flex flex-1 items-center gap-3 overflow-x-auto">
          <span className="shrink-0 text-sm text-muted">
            比较 ({count}/4)
          </span>
          {items.map((product) => (
            <div key={product.id} className="group/item relative shrink-0">
              <div className="h-12 w-12 overflow-hidden rounded border border-border">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-light text-muted">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeFromCompare(product.id)}
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white opacity-0 transition-opacity group-hover/item:opacity-100"
                title="移除"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={clearCompare}
            className="rounded border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-500 hover:text-red-400"
          >
            清空
          </button>
          <Link
            href="/compare"
            className="rounded bg-gold px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-gold-light"
          >
            开始比较
          </Link>
        </div>
      </div>
    </div>
  )
}
