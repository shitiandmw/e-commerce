"use client"

import { useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-store"
import {
  getManualPromotionCodes,
  hasPromotionCode,
  normalizePromotionCode,
} from "@/lib/promotion"

export function PromoCodeForm() {
  const t = useTranslations()
  const { cart, loading, applyPromotion, removePromotion } = useCart()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const appliedCodes = getManualPromotionCodes(cart?.promotions)
  const appliedCode = appliedCodes[0]

  const handleApply = async () => {
    const normalizedCode = normalizePromotionCode(code)
    if (!normalizedCode) return
    setError("")

    try {
      const updatedCart = await applyPromotion(normalizedCode)
      if (!hasPromotionCode(updatedCart.promotions, normalizedCode)) {
        setError(t("promo_invalid"))
        return
      }
      setCode("")
    } catch {
      setError(t("promo_invalid"))
    }
  }

  const handleRemove = async () => {
    if (!appliedCode) return
    setError("")
    try {
      await removePromotion(appliedCode)
    } catch {
      setError(t("promo_remove_error"))
    }
  }

  if (appliedCode) {
    return (
      <div className="space-y-2">
        <div className="flex min-h-9 items-center justify-between gap-3 border border-border/50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-foreground">
            <Check className="size-4 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate font-mono font-medium">{appliedCode}</span>
            <span className="text-muted-foreground">{t("promo_applied")}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            disabled={loading}
            aria-label={t("promo_remove")}
          >
            {loading ? <Loader2 className="animate-spin" /> : <X />}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setError("")
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void handleApply()
            }
          }}
          placeholder={t("promo_code")}
          autoComplete="off"
          className="font-mono uppercase"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading && <Loader2 className="animate-spin" />}
          {t("apply")}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
