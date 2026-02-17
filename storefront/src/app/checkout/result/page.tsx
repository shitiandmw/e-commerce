"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function CheckIcon() {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
      <svg className="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function FailIcon() {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
      <svg className="h-10 w-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

function ResultContent() {
  const params = useSearchParams()
  const status = params.get("status")
  const isSuccess = status === "success"

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center md:py-24">
      {isSuccess ? <CheckIcon /> : <FailIcon />}
      <h1 className="mt-6 text-xl font-bold text-foreground md:text-2xl">
        {isSuccess ? "支付成功" : "支付失败"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSuccess
          ? "感谢您的购买，我们将尽快为您发货。"
          : "支付未能完成，请重试或联系客服。"}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {isSuccess ? (
          <>
            <Link href="/account/orders"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light sm:w-auto">
              查看订单
            </Link>
            <Link href="/products"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-border px-6 py-3 text-sm text-foreground transition-colors hover:border-gold sm:w-auto">
              继续购物
            </Link>
          </>
        ) : (
          <>
            <Link href="/checkout"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-gold-light sm:w-auto">
              重新支付
            </Link>
            <Link href="/"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-border px-6 py-3 text-sm text-foreground transition-colors hover:border-gold sm:w-auto">
              返回首页
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>}>
      <ResultContent />
    </Suspense>
  )
}
