"use client"

import { useTranslations } from "next-intl"
import { CheckCircle, Loader2, Shield } from "lucide-react"
import { useState } from "react"

interface DirectOrderPaymentProps {
  onSuccess: () => Promise<void>
  totalLabel: string
}

export function DirectOrderPayment({ onSuccess, totalLabel }: DirectOrderPaymentProps) {
  const t = useTranslations()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onSuccess()
    } catch (e: any) {
      setError(e.message || t("checkout_order_failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="rounded-md border border-gold/20 bg-gold/5 p-5 flex items-start gap-3 mb-6">
        <Shield className="size-5 text-gold mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-foreground font-medium">{t("checkout_direct_order")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("checkout_direct_order_desc")}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("checkout_processing")}
          </>
        ) : (
          <>
            <CheckCircle className="size-4" />
            {t("checkout_place_order", { total: totalLabel })}
          </>
        )}
      </button>
    </div>
  )
}
