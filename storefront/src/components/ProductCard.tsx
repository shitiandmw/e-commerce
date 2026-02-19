"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/CartProvider"
import { useCompare, type CompareProduct } from "@/components/CompareProvider"

interface VariantOption {
  id: string
  value: string
  option_id: string
}

interface VariantPrice {
  amount: number
  currency_code: string
}

interface ProductVariant {
  id: string
  title?: string
  options?: VariantOption[]
  prices?: VariantPrice[]
  calculated_price?: {
    calculated_amount?: number
    original_amount?: number
    currency_code?: string
  }
}

interface ProductOption {
  id: string
  title: string
  values?: { id: string; value: string }[]
}

interface ProductCardProps {
  product: {
    id: string
    title: string
    handle: string
    thumbnail: string | null
    variants?: ProductVariant[]
    options?: ProductOption[]
    brand?: { name: string; name_zh?: string; logo_url?: string } | null
    metadata?: Record<string, unknown> | null
  }
}

function getPackaging(product: ProductCardProps["product"]): string | null {
  if (product.metadata?.packaging) return String(product.metadata.packaging)
  const variant = product.variants?.[0]
  if (product.options) {
    for (const opt of product.options) {
      if (/pack|包装|规格|装/i.test(opt.title)) {
        const val = variant?.options?.find((vo) => vo.option_id === opt.id)
        if (val?.value) return val.value
      }
    }
  }
  return null
}

function PriceDisplay({ variant }: { variant?: ProductVariant }) {
  if (!variant) return null
  const cp = variant.calculated_price
  const fallbackPrice = variant.prices?.[0]

  if (cp && cp.calculated_amount != null && cp.currency_code) {
    const hasDiscount = cp.original_amount != null && cp.original_amount > cp.calculated_amount
    const currency = cp.currency_code.toUpperCase()
    const discountPct = hasDiscount
      ? Math.round((1 - cp.calculated_amount! / cp.original_amount!) * 100)
      : 0

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold text-gold">
          {currency} {cp.calculated_amount}
        </span>
        {hasDiscount && (
          <>
            <span className="text-xs text-muted line-through">
              {currency} {cp.original_amount}
            </span>
            {discountPct > 0 && (
              <span className="rounded bg-red-500/20 px-1 py-0.5 text-[10px] font-medium text-red-400">
                -{discountPct}%
              </span>
            )}
          </>
        )}
      </div>
    )
  }

  if (fallbackPrice) {
    return (
      <p className="text-sm font-semibold text-gold">
        {fallbackPrice.currency_code.toUpperCase()} {fallbackPrice.amount}
      </p>
    )
  }

  return null
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  const variants = product.variants ?? []
  const firstVariant = variants[0]
  const hasMultipleVariants = variants.length > 1
  const brandName = product.brand?.name
  const packaging = getPackaging(product)
  const { isInCompare, addToCompare, removeFromCompare, isFull } = useCompare()
  const [showFullMsg, setShowFullMsg] = useState(false)
  const inCompare = isInCompare(product.id)

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCompare) {
      removeFromCompare(product.id)
    } else {
      const success = addToCompare(product as unknown as CompareProduct)
      if (!success) {
        setShowFullMsg(true)
        setTimeout(() => setShowFullMsg(false), 2000)
      }
    }
  }

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding) return

    if (hasMultipleVariants) {
      // Init default selections
      const initial: Record<string, string> = {}
      product.options?.forEach((opt) => {
        if (opt.values?.[0]) initial[opt.id] = opt.values[0].value
      })
      setSelectedOptions(initial)
      setShowVariantModal(true)
      return
    }

    if (!firstVariant) return
    setAdding(true)
    try {
      await addItem(firstVariant.id, 1)
    } catch {
      // silently fail - cart provider handles errors
    } finally {
      setAdding(false)
    }
  }

  const getSelectedVariant = () => {
    return variants.find((v) =>
      v.options?.every((vo) => selectedOptions[vo.option_id] === vo.value)
    ) || variants[0]
  }

  const handleModalAdd = async () => {
    const variant = getSelectedVariant()
    if (!variant || adding) return
    setAdding(true)
    try {
      await addItem(variant.id, 1)
      setShowVariantModal(false)
    } catch {
      // silently fail
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold/50">
        {/* Compare checkbox */}
        <button
          onClick={handleCompareToggle}
          title={inCompare ? "取消比较" : isFull ? "最多比较4个商品" : "加入比较"}
          className={`absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded border transition-colors ${
            inCompare
              ? "border-gold bg-gold text-background"
              : "border-border bg-background/80 text-muted hover:border-gold hover:text-gold"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {inCompare ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
        {showFullMsg && (
          <div className="absolute top-10 left-2 z-10 rounded bg-red-900/90 px-2 py-1 text-xs text-red-200 whitespace-nowrap">
            最多比较4个商品
          </div>
        )}
        <Link
          href={`/products/${product.handle}`}
          className="block"
        >
        <div className="relative aspect-square overflow-hidden bg-surface-light">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Quick add button */}
          <button
            onClick={handleQuickAdd}
            disabled={adding || !firstVariant}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-background shadow-md transition-all hover:bg-gold-light disabled:opacity-50"
            aria-label="加入购物车"
          >
            {adding ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </button>
        </div>
        <div className="p-3">
          {brandName && (
            <div className="mb-1 flex items-center gap-1.5">
              {product.brand?.logo_url ? (
                <img src={product.brand.logo_url} alt={brandName} className="h-5 w-5 rounded object-contain" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-light text-[9px] font-bold text-gold">
                  {brandName.charAt(0)}
                </span>
              )}
              <span className="text-xs text-gold">{product.brand?.name_zh || brandName}</span>
              {product.brand?.name_zh && (
                <span className="text-[10px] text-muted">{brandName}</span>
              )}
            </div>
          )}
          <h3 className="mb-1 text-sm font-medium text-foreground line-clamp-2 group-hover:text-gold transition-colors">
            {product.title}
          </h3>
          {packaging && (
            <p className="mb-1 text-xs text-muted">{packaging}</p>
          )}
          <PriceDisplay variant={firstVariant} />
        </div>
      </Link>
      </div>
      {/* Variant selection modal */}
      {showVariantModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
          onClick={(e) => { e.preventDefault(); setShowVariantModal(false) }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">选择规格</h4>
              <button
                onClick={() => setShowVariantModal(false)}
                className="text-muted hover:text-foreground"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {product.options?.map((option) => (
              <div key={option.id} className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-muted">{option.title}</label>
                <div className="flex flex-wrap gap-1.5">
                  {option.values?.map((val) => (
                    <button
                      key={val.id}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.id]: val.value }))}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        selectedOptions[option.id] === val.value
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border text-foreground hover:border-gold/50"
                      }`}
                    >
                      {val.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleModalAdd}
              disabled={adding}
              className="mt-2 w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gold-light disabled:opacity-50"
            >
              {adding ? "添加中..." : "加入购物车"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
