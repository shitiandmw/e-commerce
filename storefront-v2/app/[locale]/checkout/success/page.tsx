"use client"

import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, ArrowRight, Package, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { getToken } from "@/lib/auth"

interface Order {
  id: string
  display_id?: number
  status?: string
  total?: number
  currency_code?: string
}

export default function CheckoutSuccessPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(!!orderId)

  useEffect(() => {
    if (!orderId) return
    const token = getToken()
    fetch(`/api/account/orders/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => setOrder(data.order || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  const orderNumber = order?.display_id
    ? `TC-${order.display_id}`
    : orderId
      ? `TC-${orderId.slice(-8).toUpperCase()}`
      : `TC-${Date.now().toString(36).toUpperCase()}`

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="size-20 flex items-center justify-center rounded-full bg-gold/10 mx-auto mb-8">
        <CheckCircle2 className="size-10 text-gold" />
      </div>

      <h1 className="text-2xl font-serif text-foreground mb-3">{t("order_confirmed")}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        {t("order_confirmed_thanks")}
      </p>
      <p className="text-xs text-muted-foreground mb-8">
        {t("order_email_sent")}
      </p>

      <div className="bg-card border border-border/30 p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-4">
          <Package className="size-4 text-gold/60" />
          <span className="text-sm text-foreground">{t("order_details")}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/20">
              <span className="text-muted-foreground">{t("order_number")}</span>
              <span className="text-foreground font-mono">{orderNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/20">
              <span className="text-muted-foreground">{t("order_status")}</span>
              <span className="text-gold">{t("order_status_processing")}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">{t("estimated_delivery")}</span>
              <span className="text-foreground">{t("delivery_days")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide hover:bg-gold-light transition-colors"
        >
          {t("continue_shopping")}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/account/orders"
          className="text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          {t("view_orders")}
        </Link>
      </div>
    </div>
  )
}
