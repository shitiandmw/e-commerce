"use client"

import { useCart } from "@/components/CartProvider"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useLocale } from "@/lib/useLocale"

function formatPrice(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount}`
}

export default function CartPageClient() {
  const locale = useLocale()
  const { cart, loading, updateItem, removeItem, clearCart, itemCount } = useCart()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const items = cart?.items ?? []
  const isEmpty = items.length === 0

  if (!cart && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <CartEmptyIcon />
        <h1 className="mt-4 text-2xl font-bold text-foreground">购物车为空</h1>
        <p className="mt-2 text-muted">还没有添加任何商品</p>
        <Link
          href={`/${locale}/products`}
          className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
        >
          去购物
        </Link>
      </div>
    )
  }

  if (isEmpty && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <CartEmptyIcon />
        <h1 className="mt-4 text-2xl font-bold text-foreground">购物车为空</h1>
        <p className="mt-2 text-muted">还没有添加任何商品</p>
        <Link
          href={`/${locale}/products`}
          className="mt-6 inline-block rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
        >
          去购物
        </Link>
      </div>
    )
  }

  const currency = cart?.currency_code || "eur"

  async function handleQuantityChange(lineItemId: string, newQty: number) {
    if (newQty < 1) return
    setUpdatingId(lineItemId)
    try {
      await updateItem(lineItemId, newQty)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(lineItemId: string) {
    setUpdatingId(lineItemId)
    try {
      await removeItem(lineItemId)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">购物车 ({itemCount})</h1>
        <button
          onClick={clearCart}
          disabled={loading}
          className="text-sm text-muted transition-colors hover:text-red-400"
        >
          清空购物车
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => {
              const thumb =
                item.thumbnail ||
                item.variant?.product?.thumbnail ||
                null
              const productTitle =
                item.product_title ||
                item.variant?.product?.title ||
                item.title
              const variantTitle =
                item.variant_title ||
                item.variant?.title ||
                ""
              const productHandle =
                item.product_handle ||
                item.variant?.product?.handle ||
                ""
              const isUpdating = updatingId === item.id

              return (
                <div
                  key={item.id}
                  className={`flex gap-4 rounded-lg border border-border bg-surface p-4 transition-opacity ${isUpdating ? "opacity-50" : ""}`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-surface-light">
                    {thumb ? (
                      <Image src={thumb} alt={productTitle} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      {productHandle ? (
                        <Link href={`/${locale}/products/${productHandle}`} className="font-medium text-foreground hover:text-gold">
                          {productTitle}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{productTitle}</span>
                      )}
                      {variantTitle && (
                        <p className="text-xs text-muted">{variantTitle}</p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      {/* Quantity controls */}
                      <div className="flex items-center rounded-md border border-border">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="px-2 py-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="px-2 py-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isUpdating}
                        className="text-xs text-muted transition-colors hover:text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm text-muted">
                      {formatPrice(item.unit_price, currency)} x {item.quantity}
                    </p>
                    <p className="font-semibold text-gold">
                      {formatPrice(item.total, currency)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 rounded-lg border border-border bg-surface p-6">
            <div className="space-y-2">
              {cart?.subtotal != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">小计</span>
                  <span className="text-foreground">{formatPrice(cart.subtotal, currency)}</span>
                </div>
              )}
              {(cart?.discount_total ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">折扣</span>
                  <span className="text-green-400">-{formatPrice(cart!.discount_total!, currency)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <span className="text-lg font-semibold text-foreground">总计</span>
              <span className="text-lg font-bold text-gold">
                {formatPrice(cart?.total ?? cart?.subtotal ?? 0, currency)}
              </span>
            </div>
            <Link
              href={`/${locale}/checkout`}
              className="mt-4 block w-full rounded-md bg-gold py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-gold-light"
            >
              去结算
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function CartEmptyIcon() {
  return (
    <svg className="mx-auto h-24 w-24 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
