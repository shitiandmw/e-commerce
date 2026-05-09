"use client"

import { useTranslations } from "next-intl"
import { ExternalLink, Loader2, Shield } from "lucide-react"
import { useState } from "react"
import { getCartId } from "@/lib/cart"

interface WooShPayPaymentProps {
  clientSecret: string | null
  orderId?: string
}

export function WooShPayPayment({ clientSecret, orderId }: WooShPayPaymentProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRedirect = () => {
    setLoading(true)
    setError(null)
    try {
      if (!clientSecret) {
        throw new Error("No payment session data")
      }
      const parsed = JSON.parse(clientSecret)
      const inner = parsed.data || parsed
      const redirectUrl = inner.redirect_url || inner.url
      if (!redirectUrl) {
        throw new Error("No redirect URL from payment provider")
      }
      sessionStorage.setItem("wooshpay_payment_session", JSON.stringify({
        checkout_session_id: inner.checkout_session_id,
        payment_intent_id: inner.payment_intent_id,
        provider_session_id: inner.id || parsed.id,
        redirect_url: inner.redirect_url,
        url: inner.url,
        cart_id: getCartId(),
      }))
      window.location.href = redirectUrl
    } catch (e: any) {
      setError(e.message || "Payment redirect failed")
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="rounded-md border border-gold/20 bg-gold/5 p-5 flex items-start gap-3 mb-6">
        <Shield className="size-5 text-gold mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-foreground font-medium">{t("checkout_wooshpay")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("checkout_wooshpay_desc")}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleRedirect}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("checkout_processing")}
          </>
        ) : (
          <>
            <ExternalLink className="size-4" />
            {t("checkout_proceed_to_pay")}
          </>
        )}
      </button>
    </div>
  )
}
