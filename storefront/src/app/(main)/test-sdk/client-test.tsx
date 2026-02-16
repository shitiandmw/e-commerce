"use client"

import { useState } from "react"
import { sdk } from "@/lib/medusa"

export default function ClientSDKTest() {
  const [result, setResult] = useState<{
    products: { id: string; title: string }[]
    count: number
    error: string | null
  } | null>(null)
  const [loading, setLoading] = useState(false)

  async function testConnection() {
    setLoading(true)
    try {
      const { products, count } = await sdk.store.product.list({ limit: 5 })
      setResult({ products: products as { id: string; title: string }[], count, error: null })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setResult({ products: [], count: 0, error: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        客户端测试 (Client Component)
      </h2>
      <button
        onClick={testConnection}
        disabled={loading}
        className="mb-4 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {loading ? "测试中..." : "测试 SDK 连接"}
      </button>
      {result && (
        <div>
          {result.error ? (
            <p className="text-red-400">错误: {result.error}</p>
          ) : (
            <div>
              <p className="mb-2 text-muted">
                共找到 <span className="text-gold">{result.count}</span> 个商品
              </p>
              {result.products.length > 0 ? (
                <ul className="space-y-2">
                  {result.products.map((p) => (
                    <li key={p.id} className="text-sm text-foreground">
                      • {p.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">暂无商品数据</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
