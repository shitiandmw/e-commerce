"use client"

import { useEffect, useState, useCallback } from "react"
import { Link } from "@/i18n/navigation"
import { getCustomer, getToken } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  display_id: number
  created_at: string
  status: string
  total: number
  currency_code: string
}

export default function AccountPage() {
  const t = useTranslations()
  const [customer, setCustomer] = useState<Record<string, string> | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t("status_pending"),
      completed: t("status_completed"),
      canceled: t("status_canceled"),
      requires_action: t("status_requires_action"),
      archived: t("status_archived"),
    }
    return map[s] || s
  }

  const loadData = useCallback(async () => {
    const c = await getCustomer()
    setCustomer(c)
    const token = getToken()
    if (token) {
      try {
        const res = await fetch("/api/account/orders?limit=3&offset=0", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } catch { /* empty */ }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN")
  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency || "USD" }).format(amount)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("account_overview_title")}</h1>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">{t("personal_info")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">{t("name_label")}</span>
              <p className="text-foreground">{customer?.last_name}{customer?.first_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("email")}</span>
              <p className="text-foreground">{customer?.email}</p>
            </div>
            {customer?.phone && (
              <div>
                <span className="text-muted-foreground">{t("phone")}</span>
                <p className="text-foreground">{customer.phone}</p>
              </div>
            )}
          </div>
          <Link href="/account/profile" className="mt-4 inline-block text-sm text-gold hover:text-gold/80">
            {t("edit_profile_link")}
          </Link>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("recent_orders")}</CardTitle>
          <Link href="/account/orders" className="text-sm text-gold hover:text-gold/80">
            {t("view_all_link")}
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("no_orders")}</p>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("order_prefix")} #{order.display_id}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{formatPrice(order.total, order.currency_code)}</p>
                    <Badge variant="outline" className="text-xs">{statusLabel(order.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
