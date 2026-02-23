"use client"

import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripe } from "@/lib/stripe"
import { useTranslations } from "next-intl"
import { Lock, Loader2 } from "lucide-react"

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#c8a96e",
    colorBackground: "#1a1a1a",
    colorText: "#e5e5e5",
    colorDanger: "#ef4444",
    fontFamily: "inherit",
    borderRadius: "2px",
  },
}

interface StripePaymentProps {
  clientSecret: string
  onSuccess: () => void
  totalLabel: string
}

function PaymentForm({ onSuccess, totalLabel }: { onSuccess: () => void; totalLabel: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const t = useTranslations()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || t("checkout_payment_failed"))
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (confirmError) {
      setError(confirmError.message || t("checkout_payment_failed"))
      setProcessing(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <p className="text-xs text-red-400 mt-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("checkout_processing")}
          </>
        ) : (
          <>
            <Lock className="size-3.5" />
            {totalLabel}
          </>
        )}
      </button>
    </form>
  )
}

export function StripePayment({ clientSecret, onSuccess, totalLabel }: StripePaymentProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance }}
    >
      <PaymentForm onSuccess={onSuccess} totalLabel={totalLabel} />
    </Elements>
  )
}
