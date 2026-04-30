"use client"

import type { PaymentMethod } from "@/lib/cart"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { CreditCard, Banknote, Loader2 } from "lucide-react"

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selected: string | null
  onSelect: (providerId: string) => void
  loading?: boolean
  onContinue: () => void
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  pp_system_default: <Banknote className="size-5 text-muted-foreground" />,
  pp_stripe_stripe: <CreditCard className="size-5 text-muted-foreground" />,
  pp_wooshpay_wooshpay: <CreditCard className="size-5 text-muted-foreground" />,
}

export function PaymentMethodSelector({
  methods,
  selected,
  onSelect,
  loading,
  onContinue,
}: PaymentMethodSelectorProps) {
  const t = useTranslations()

  if (methods.length === 0) {
    return (
      <div className="rounded-md border border-border/30 p-6 text-center">
        <CreditCard className="size-6 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{t("checkout_no_payment_methods")}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-serif text-foreground mb-6">{t("checkout_select_payment_title")}</h2>
      <div className="flex flex-col gap-3">
        {methods.map((method) => {
          const isSelected = selected === method.provider_id
          return (
            <button
              key={method.provider_id}
              type="button"
              onClick={() => onSelect(method.provider_id)}
              disabled={loading}
              className={cn(
                "flex items-center gap-4 p-4 border transition-colors text-left",
                isSelected
                  ? "border-gold/50 bg-gold/5"
                  : "border-border/30 hover:border-gold/30"
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  isSelected ? "border-gold" : "border-border/50"
                )}
              >
                {isSelected && <div className="size-2.5 rounded-full bg-gold" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  {method.display_name || t(`checkout_payment_${method.provider_id}`) || method.provider_id}
                </p>
                {method.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                )}
              </div>
              <div className="text-muted-foreground shrink-0">
                {PROVIDER_ICONS[method.provider_id] ?? <CreditCard className="size-5" />}
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="flex items-center gap-2 bg-gold text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("checkout_continue")}
          </button>
        </div>
      )}
    </div>
  )
}
