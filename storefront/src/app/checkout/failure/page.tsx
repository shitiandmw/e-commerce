"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [reason, setReason] = useState<string | null>(null)
  const [hasContext, setHasContext] = useState(false)

  useEffect(() => {
    const r = searchParams.get("reason")
    const fromCheckout = searchParams.get("from") === "checkout" || !!r
    if (!fromCheckout) {
      router.replace("/")
      return
    }
    setReason(r)
    setHasContext(true)
  }, [searchParams, router])

  if (!hasContext) {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-muted">加载中...</p></div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">支付失败</h1>
      {reason && <p className="mb-2 text-muted">失败原因: {reason}</p>}
      {!reason && <p className="mb-2 text-muted">支付未能完成，请重试或选择其他支付方式。</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/checkout" className="rounded bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90">
          重试支付
        </Link>
        <Link href="/cart" className="rounded border border-border px-6 py-2 text-sm font-medium hover:bg-muted/20">
          返回购物车
        </Link>
        <Link href="/products" className="rounded border border-border px-6 py-2 text-sm font-medium hover:bg-muted/20">
          继续购物
        </Link>
      </div>
    </div>
  )
}
