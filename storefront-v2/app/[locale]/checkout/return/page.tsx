"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { CartApiError, completeCart, getCartId, removeCartId, setCartId } from "@/lib/cart"
import { getToken, isAuthFailureStatus } from "@/lib/auth"

type ReturnState = "processing" | "pending" | "failed" | "cancelled"

const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 1800

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isFailureStatus(value: string | null): boolean {
  if (!value) return false
  return ["failed", "failure", "error", "payment_failed"].includes(value.toLowerCase())
}

function isCancelledStatus(value: string | null): boolean {
  if (!value) return false
  return ["cancel", "canceled", "cancelled"].includes(value.toLowerCase())
}

function isAuthFailure(error: unknown): boolean {
  return error instanceof CartApiError && isAuthFailureStatus(error.status)
}

export default function WooShPayReturnPage() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<ReturnState>("processing")
  const [attempts, setAttempts] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const inFlightRef = useRef(false)

  const explicitStatus = useMemo(() => {
    const candidates = [
      searchParams.get("status"),
      searchParams.get("redirect_status"),
      searchParams.get("payment_status"),
    ]
    return candidates.find(Boolean) ?? null
  }, [searchParams])

  const completeWhenReady = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    const storedCartId = getCartId()
    const queryCartId = searchParams.get("cart_id")
    const cartId = storedCartId || queryCartId
    const startedWithCustomerToken = Boolean(getToken())

    if (!cartId) {
      setState("failed")
      setLastError(t("checkout_payment_return_failed"))
      inFlightRef.current = false
      return
    }

    if (!storedCartId && queryCartId) {
      setCartId(queryCartId)
    }

    if (!startedWithCustomerToken) {
      setState("failed")
      setLastError(t("checkout_payment_return_auth_expired"))
      inFlightRef.current = false
      return
    }

    setState("processing")
    setLastError(null)

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      setAttempts(attempt)
      try {
        const result = await completeCart()
        if (result.type === "order" && result.order) {
          removeCartId()
          router.push(`/checkout/success?order_id=${result.order.id}`)
          return
        }
        setLastError(result.error || null)
      } catch (error) {
        if (startedWithCustomerToken && isAuthFailure(error)) {
          setLastError(t("checkout_payment_return_auth_expired"))
          setState("failed")
          inFlightRef.current = false
          return
        }
        setLastError(error instanceof Error ? error.message : null)
      }

      if (attempt < MAX_ATTEMPTS) {
        await delay(RETRY_DELAY_MS)
      }
    }

    setState("pending")
    inFlightRef.current = false
  }, [router, searchParams, t])

  useEffect(() => {
    if (isCancelledStatus(explicitStatus)) {
      setState("cancelled")
      return
    }

    if (isFailureStatus(explicitStatus)) {
      setState("failed")
      return
    }

    void completeWhenReady()
  }, [completeWhenReady, explicitStatus])

  const isProcessing = state === "processing"
  const icon = isProcessing ? (
    <Loader2 className="size-10 animate-spin text-gold" />
  ) : (
    <AlertCircle className="size-10 text-gold" />
  )
  const title = state === "cancelled"
    ? t("checkout_payment_return_cancelled")
    : state === "failed"
      ? t("checkout_payment_return_failed")
      : state === "pending"
        ? t("checkout_payment_return_pending")
        : t("checkout_payment_return_processing")

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="size-20 flex items-center justify-center rounded-full bg-gold/10 mx-auto mb-8">
        {icon}
      </div>

      <h1 className="text-2xl font-serif text-foreground mb-3">{title}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        {isProcessing
          ? t("checkout_payment_return_processing_desc")
          : state === "pending"
            ? t("checkout_payment_return_pending_desc")
            : t("checkout_payment_return_failed_desc")}
      </p>
      {isProcessing && (
        <p className="text-xs text-muted-foreground mb-8">
          {t("checkout_payment_return_attempt", { current: attempts, total: MAX_ATTEMPTS })}
        </p>
      )}
      {!isProcessing && lastError && (
        <p className="text-xs text-muted-foreground mb-8">{lastError}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {state === "pending" && (
          <button
            type="button"
            onClick={() => void completeWhenReady()}
            className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
          >
            <RefreshCw className="size-4" />
            {t("checkout_payment_return_retry")}
          </button>
        )}
        <Link
          href="/checkout"
          className={state === "pending"
            ? "text-sm text-muted-foreground hover:text-gold transition-colors"
            : "inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"}
        >
          <ArrowLeft className="size-4" />
          {t("checkout_payment_return_back_to_checkout")}
        </Link>
        {state !== "processing" && (
          <Link
            href="/cart"
            className="text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            {t("checkout_back_to_cart")}
          </Link>
        )}
      </div>
    </div>
  )
}
