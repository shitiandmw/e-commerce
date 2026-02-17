"use client"

import Image from "next/image"
import Link from "next/link"
import { useCompare } from "@/components/CompareProvider"
import { useCart } from "@/components/CartProvider"
import { useState } from "react"

export default function CompareClient() {
  const { items, removeFromCompare, clearCompare } = useCompare()
  const { addItem, loading: cartLoading } = useCart()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedMsg, setAddedMsg] = useState<Record<string, string>>({})

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <svg className="mx-auto mb-4 h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        <h1 className="mb-2 text-2xl font-bold text-foreground">暂无比较商品</h1>
        <p className="mb-6 text-muted">请先在商品列表中选择要比较的商品</p>
        <Link
          href="/products"
          className="inline-block rounded bg-gold px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold-light"
        >
          浏览商品
        </Link>
      </div>
    )
  }

  const handleAddToCart = async (productId: string) => {
    const product = items.find((p) => p.id === productId)
    const variantId = product?.variants?.[0]?.id
    if (!variantId) return
    setAddingId(productId)
    try {
      await addItem(variantId, 1)
      setAddedMsg((prev) => ({ ...prev, [productId]: "已加入购物车" }))
      setTimeout(() => setAddedMsg((prev) => ({ ...prev, [productId]: "" })), 2000)
    } catch {
      setAddedMsg((prev) => ({ ...prev, [productId]: "添加失败" }))
    } finally {
      setAddingId(null)
    }
  }

  // Collect all unique option titles across products
  const allOptionTitles = Array.from(
    new Set(items.flatMap((p) => p.options?.map((o) => o.title) ?? []))
  )

  const getOptionValue = (product: (typeof items)[0], optionTitle: string) => {
    const option = product.options?.find((o) => o.title === optionTitle)
    return option?.values?.map((v) => v.value).join(", ") ?? "-"
  }

  const getPrice = (product: (typeof items)[0]) => {
    const price = product.variants?.[0]?.prices?.[0]
    if (!price) return "价格待定"
    return `${price.currency_code.toUpperCase()} ${price.amount}`
  }

  const getStock = (product: (typeof items)[0]) => {
    const variant = product.variants?.[0]
    if (!variant) return "-"
    if (variant.manage_inventory === false) return "有货"
    return (variant.inventory_quantity ?? 0) > 0 ? "有货" : "缺货"
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">商品比较</h1>
        <button
          onClick={clearCompare}
          className="rounded border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-red-500 hover:text-red-400"
        >
          清空全部
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-32 border-b border-border p-3 text-left text-sm font-medium text-muted"></th>
              {items.map((product) => (
                <th key={product.id} className="border-b border-border p-3 text-center" style={{ minWidth: 180 }}>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="mb-2 text-xs text-muted hover:text-red-400 transition-colors"
                  >
                    移除
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Image row */}
            <tr>
              <td className="border-b border-border p-3 text-sm text-muted">图片</td>
              {items.map((product) => (
                <td key={product.id} className="border-b border-border p-3 text-center">
                  <Link href={`/products/${product.handle}`} className="inline-block">
                    <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-lg bg-surface-light">
                      {product.thumbnail ? (
                        <Image src={product.thumbnail} alt={product.title} fill className="object-cover" sizes="128px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                </td>
              ))}
            </tr>
            {/* Name row */}
            <tr>
              <td className="border-b border-border p-3 text-sm text-muted">名称</td>
              {items.map((product) => (
                <td key={product.id} className="border-b border-border p-3 text-center">
                  <Link href={`/products/${product.handle}`} className="text-sm font-medium text-foreground hover:text-gold transition-colors">
                    {product.title}
                  </Link>
                </td>
              ))}
            </tr>
            {/* Brand row */}
            <tr>
              <td className="border-b border-border p-3 text-sm text-muted">品牌</td>
              {items.map((product) => (
                <td key={product.id} className="border-b border-border p-3 text-center text-sm text-gold">
                  {product.brand?.name ?? "-"}
                </td>
              ))}
            </tr>
            {/* Price row */}
            <tr>
              <td className="border-b border-border p-3 text-sm text-muted">价格</td>
              {items.map((product) => (
                <td key={product.id} className="border-b border-border p-3 text-center text-sm font-semibold text-gold">
                  {getPrice(product)}
                </td>
              ))}
            </tr>
            {/* Option rows */}
            {allOptionTitles.map((optTitle) => (
              <tr key={optTitle}>
                <td className="border-b border-border p-3 text-sm text-muted">{optTitle}</td>
                {items.map((product) => (
                  <td key={product.id} className="border-b border-border p-3 text-center text-sm text-foreground">
                    {getOptionValue(product, optTitle)}
                  </td>
                ))}
              </tr>
            ))}
            {/* Stock row */}
            <tr>
              <td className="border-b border-border p-3 text-sm text-muted">库存</td>
              {items.map((product) => {
                const stock = getStock(product)
                return (
                  <td key={product.id} className={`border-b border-border p-3 text-center text-sm ${stock === "有货" ? "text-green-400" : stock === "缺货" ? "text-red-400" : "text-muted"}`}>
                    {stock}
                  </td>
                )
              })}
            </tr>
            {/* Description row */}
            <tr>
              <td className="border-b border-border p-3 text-sm text-muted">描述</td>
              {items.map((product) => (
                <td key={product.id} className="border-b border-border p-3 text-center text-xs text-muted leading-relaxed">
                  {product.description ? (
                    <span className="line-clamp-4">{product.description}</span>
                  ) : "-"}
                </td>
              ))}
            </tr>
            {/* Add to cart row */}
            <tr>
              <td className="p-3 text-sm text-muted">操作</td>
              {items.map((product) => {
                const variant = product.variants?.[0]
                const inStock = variant?.manage_inventory === false || (variant?.inventory_quantity ?? 0) > 0
                const msg = addedMsg[product.id]
                return (
                  <td key={product.id} className="p-3 text-center">
                    <button
                      disabled={!variant?.id || !inStock || addingId === product.id || cartLoading}
                      onClick={() => handleAddToCart(product.id)}
                      className="rounded bg-gold px-4 py-2 text-xs font-semibold text-background transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingId === product.id ? "添加中..." : inStock ? "加入购物车" : "缺货"}
                    </button>
                    {msg && (
                      <p className={`mt-1 text-xs ${msg === "已加入购物车" ? "text-green-400" : "text-red-400"}`}>{msg}</p>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile cards - horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:hidden">
        {items.map((product) => {
          const price = product.variants?.[0]?.prices?.[0]
          const variant = product.variants?.[0]
          const inStock = variant?.manage_inventory === false || (variant?.inventory_quantity ?? 0) > 0
          const msg = addedMsg[product.id]
          return (
            <div key={product.id} className="w-64 shrink-0 rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 flex items-start justify-between">
                <Link href={`/products/${product.handle}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-surface-light">
                  {product.thumbnail ? (
                    <Image src={product.thumbnail} alt={product.title} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </Link>
                <button onClick={() => removeFromCompare(product.id)} className="text-xs text-muted hover:text-red-400">移除</button>
              </div>
              <h3 className="mb-1 text-sm font-medium text-foreground line-clamp-2">{product.title}</h3>
              {product.brand && <p className="mb-1 text-xs text-gold">{product.brand.name}</p>}
              {price && <p className="mb-1 text-sm font-semibold text-gold">{price.currency_code.toUpperCase()} {price.amount}</p>}
              <p className={`mb-2 text-xs ${inStock ? "text-green-400" : "text-red-400"}`}>{inStock ? "有货" : "缺货"}</p>
              {allOptionTitles.map((optTitle) => (
                <p key={optTitle} className="text-xs text-muted"><span className="text-foreground">{optTitle}:</span> {getOptionValue(product, optTitle)}</p>
              ))}
              <button
                disabled={!variant?.id || !inStock || addingId === product.id || cartLoading}
                onClick={() => handleAddToCart(product.id)}
                className="mt-3 w-full rounded bg-gold px-3 py-2 text-xs font-semibold text-background transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingId === product.id ? "添加中..." : inStock ? "加入购物车" : "缺货"}
              </button>
              {msg && <p className={`mt-1 text-center text-xs ${msg === "已加入购物车" ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
