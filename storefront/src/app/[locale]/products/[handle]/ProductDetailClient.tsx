"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/components/CartProvider"

interface Price {
  amount: number
  currency_code: string
}

interface OptionValue {
  id: string
  value: string
  option_id: string
}

interface Variant {
  id: string
  title: string
  options?: OptionValue[]
  prices?: Price[]
  calculated_price?: {
    calculated_amount?: number
    original_amount?: number
    currency_code?: string
  }
  manage_inventory?: boolean
  inventory_quantity?: number
}

interface ProductOption {
  id: string
  title: string
  values?: { id: string; value: string }[]
}

interface ProductImage {
  id: string
  url: string
}

interface Product {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: ProductImage[]
  options?: ProductOption[]
  variants?: Variant[]
  brand?: { id: string; name: string } | null
  tags?: { id: string; value: string }[]
  metadata?: Record<string, unknown> | null
}

export default function ProductDetailClient({ product: initialProduct, handle }: { product?: Product; handle?: string }) {
  const { addItem, loading } = useCart()
  const [adding, setAdding] = useState(false)
  const [addedMsg, setAddedMsg] = useState("")
  const [product, setProduct] = useState<Product | null>(initialProduct || null)
  const [fetchLoading, setFetchLoading] = useState(!initialProduct && !!handle)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialProduct || !handle) return
    const fields = "id,title,handle,subtitle,description,thumbnail,images.*,options.*,options.values.*,variants.*,variants.options.*,variants.prices.*,variants.inventory_quantity,*brand,tags.*,metadata"
    fetch(`/api/products?handle=${encodeURIComponent(handle)}&fields=${encodeURIComponent(fields)}&limit=1`)
      .then(r => r.json())
      .then(data => {
        const p = data.products?.[0] || null
        setProduct(p)
        if (p?.options) {
          const init: Record<string, string> = {}
          p.options.forEach((opt: ProductOption) => {
            if (opt.values?.[0]) init[opt.id] = opt.values[0].value
          })
          setSelectedOptions(init)
        }
        setFetchLoading(false)
      })
      .catch(() => setFetchLoading(false))
  }, [handle, initialProduct])

  // Initialize selectedOptions when product is passed as prop
  useEffect(() => {
    if (!initialProduct?.options) return
    const init: Record<string, string> = {}
    initialProduct.options.forEach((opt) => {
      if (opt.values?.[0]) init[opt.id] = opt.values[0].value
    })
    setSelectedOptions(init)
  }, [initialProduct])

  const images = product?.images?.length
    ? product.images
    : product?.thumbnail
      ? [{ id: "thumb", url: product.thumbnail }]
      : []

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null
    return product.variants.find((v) =>
      v.options?.every((vo) => selectedOptions[vo.option_id] === vo.value)
    ) || product.variants[0]
  }, [product?.variants, selectedOptions])

  const price = selectedVariant?.prices?.[0]
  const cp = selectedVariant?.calculated_price
  const inStock = selectedVariant?.manage_inventory === false ||
    (selectedVariant?.inventory_quantity ?? 0) > 0

  // Packaging info from metadata or variant options
  const packaging = useMemo(() => {
    if (!product) return null
    if (product.metadata?.packaging) return String(product.metadata.packaging)
    if (product.options) {
      for (const opt of product.options) {
        if (/pack|包装|规格|装/i.test(opt.title)) {
          const val = selectedVariant?.options?.find((vo) => vo.option_id === opt.id)
          if (val?.value) return val.value
        }
      }
    }
    return null
  }, [product, selectedVariant])

  if (fetchLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-lg bg-surface-light" />
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-surface-light" />
            <div className="h-8 w-64 rounded bg-surface-light" />
            <div className="h-6 w-24 rounded bg-surface-light" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-lg text-muted">商品未找到</p>
        <Link href="/products" className="mt-4 inline-block text-gold hover:underline">浏览全部商品</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-surface-light">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage].url}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                    i === selectedImage ? "border-gold" : "border-border hover:border-gold/50"
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.brand && (
            <Link href={`/brands/${product.brand.id}`} className="mb-2 inline-block text-sm text-gold hover:text-gold-light">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">{product.title}</h1>
          {product.subtitle && (
            <p className="mb-4 text-muted">{product.subtitle}</p>
          )}

          {/* Price */}
          <div className="mb-6">
            {cp && cp.calculated_amount != null && cp.currency_code ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-bold text-gold">
                    {cp.currency_code.toUpperCase()} {cp.calculated_amount}
                  </span>
                  {cp.original_amount != null && cp.original_amount > cp.calculated_amount && (
                    <>
                      <span className="text-base text-muted line-through">
                        {cp.currency_code.toUpperCase()} {cp.original_amount}
                      </span>
                      {(() => {
                        const pct = Math.round((1 - cp.calculated_amount! / cp.original_amount!) * 100)
                        return pct > 0 ? (
                          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                            -{pct}%
                          </span>
                        ) : null
                      })()}
                    </>
                  )}
                </div>
              </div>
            ) : price ? (
              <p className="text-2xl font-bold text-gold">
                {price.currency_code.toUpperCase()} {price.amount}
              </p>
            ) : (
              <p className="text-lg text-muted">价格待定</p>
            )}
            {packaging && (
              <p className="mt-1 text-sm text-muted">{packaging}</p>
            )}
            <p className={`mt-1 text-sm ${inStock ? "text-green-400" : "text-red-400"}`}>
              {inStock ? "有货" : "缺货"}
            </p>
          </div>

          {/* Variant Options */}
          {product.options && product.options.length > 0 && (
            <div className="mb-6 space-y-4">
              {product.options.map((option) => (
                <div key={option.id}>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {option.title}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {option.values?.map((val) => (
                      <button
                        key={val.id}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.id]: val.value }))}
                        className={`rounded-md border px-4 py-2 text-sm transition-colors ${
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
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-surface-light px-3 py-1 text-xs text-muted">
                    {tag.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            disabled={!inStock || adding || loading}
            onClick={async () => {
              if (!selectedVariant) return
              setAdding(true)
              setAddedMsg("")
              try {
                await addItem(selectedVariant.id, 1)
                setAddedMsg("已加入购物车")
                setTimeout(() => setAddedMsg(""), 2000)
              } catch (e) {
                setAddedMsg(e instanceof Error ? e.message : "添加失败")
              } finally {
                setAdding(false)
              }
            }}
            className="w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? "添加中..." : inStock ? "加入购物车" : "暂时缺货"}
          </button>
          {addedMsg && (
            <p className={`mt-2 text-center text-sm ${addedMsg === "已加入购物车" ? "text-green-400" : "text-red-400"}`}>
              {addedMsg}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">商品描述</h2>
              <p className="text-sm leading-relaxed text-muted">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
