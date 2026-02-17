"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [displayId, setDisplayId] = useState<string | null>(null)

  useEffect(() => {
    const oid = searchParams.get("order_id")
    const did = searchParams.get("display_id")
    if (!oid && !did) {
      router.replace("/")
      return
    }
    setOrderId(oid)
    setDisplayId(did)
  }, [searchParams, router])

  if (!orderId && !displayId) {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-muted">加载中...</p></div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">支付成功</h1>
      <p className="mb-2 text-muted">感谢您的购买！您的订单已确认。</p>
      {displayId && <p className="mb-6 text-lg font-semibold">订单号: #{displayId}</p>}
      {orderId && !displayId && <p className="mb-6 text-sm text-muted">订单 ID: {orderId}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/account/orders" className="rounded bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90">
          查看订单
        </Link>
        <Link href="/products" className="rounded border border-border px-6 py-2 text-sm font-medium hover:bg-muted/20">
          继续购物
        </Link>
      </div>
    </div>
  )
}
