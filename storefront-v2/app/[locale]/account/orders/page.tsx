"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useTranslations } from "next-intl"

interface TrackingEvent {
  status: string
  description: string
  location: string | null
  occurred_at: string
}

interface TrackingInfo {
  id: string
  tracking_number: string
  carrier: string
  carrier_name: string
  status: string
  tracking_url: string | null
  events: TrackingEvent[]
}

interface OrderItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  thumbnail?: string
}

interface Order {
  id: string
  display_id: number
  created_at: string
  status: string
  total: number
  currency_code: string
  items: OrderItem[]
  shipping_address?: {
    first_name: string; last_name: string; address_1: string
    city: string; province?: string; postal_code: string
  }
  payment_status?: string
  fulfillment_status?: string
}

const PAGE_SIZE = 10

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<Order | null>(null)
  const t = useTranslations()

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t("status_pending"), completed: t("status_completed"), canceled: t("status_canceled"),
      requires_action: t("status_requires_action"), archived: t("status_archived")
    }
    return map[s] || s
  }
  const paymentLabel = (s?: string) => {
    if (!s) return "-"
    const map: Record<string, string> = {
      not_paid: t("payment_not_paid"), awaiting: t("payment_awaiting"), captured: t("payment_captured"),
      refunded: t("payment_refunded"), partially_refunded: t("payment_partially_refunded"), canceled: t("payment_canceled")
    }
    return map[s] || s
  }
  const fulfillmentLabel = (s?: string) => {
    if (!s) return "-"
    const map: Record<string, string> = {
      not_fulfilled: t("fulfillment_not_fulfilled"), fulfilled: t("fulfillment_fulfilled"),
      partially_fulfilled: t("fulfillment_partially_fulfilled"), shipped: t("fulfillment_shipped"),
      delivered: t("fulfillment_delivered"), returned: t("fulfillment_returned"), canceled: t("fulfillment_canceled")
    }
    return map[s] || s
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      const fields = encodeURIComponent("+items,+items.thumbnail,+shipping_address")
      const res = await fetch(
        `/api/account/orders?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}&fields=${fields}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setTotal(data.count || 0)
      }
    } catch { /* empty */ }
    setLoading(false)
  }, [page])

  useEffect(() => { loadOrders() }, [loadOrders])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo[]>([])
  const [trackingLoading, setTrackingLoading] = useState(false)

  const loadTracking = useCallback(async (orderId: string) => {
    setTrackingLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/account/orders/${orderId}/tracking`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setTrackingInfo(data.tracking || [])
      }
    } catch { /* empty */ }
    setTrackingLoading(false)
  }, [])

  useEffect(() => {
    if (detail) loadTracking(detail.id)
    else setTrackingInfo([])
  }, [detail, loadTracking])

  const trackingStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t("tracking_pending"), in_transit: t("tracking_in_transit"),
      out_for_delivery: t("tracking_out_for_delivery"), delivered: t("tracking_delivered"),
      exception: t("tracking_exception"), expired: t("tracking_expired"),
    }
    return map[s] || s
  }

  if (detail) {
    return (
      <div className="space-y-6">
        <button onClick={() => setDetail(null)} className="text-sm text-gold hover:text-gold/80">{t("back_to_orders")}</button>
        <h1 className="text-2xl font-bold text-foreground">{t("order_prefix")} #{detail.display_id}</h1>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">{t("order_info")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-muted-foreground">{t("date_label")}</span>{formatDate(detail.created_at)}</div>
              <div><span className="text-muted-foreground">{t("status_label")}</span><Badge variant="outline">{statusLabel(detail.status)}</Badge></div>
              <div><span className="text-muted-foreground">{t("payment_label")}</span>{paymentLabel(detail.payment_status)}</div>
              <div><span className="text-muted-foreground">{t("logistics_label")}</span>{fulfillmentLabel(detail.fulfillment_status)}</div>
              <div><span className="text-muted-foreground">{t("total_label")}</span>{formatPrice(detail.total, detail.currency_code)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Information */}
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">{t("tracking_title")}</CardTitle></CardHeader>
          <CardContent>
            {trackingLoading ? (
              <div className="h-16 animate-pulse rounded bg-muted" />
            ) : trackingInfo.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tracking_none")}</p>
            ) : (
              <div className="space-y-6">
                {trackingInfo.map((tr) => (
                  <div key={tr.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tr.carrier_name}</p>
                        <p className="text-xs text-muted-foreground">{t("tracking_number_label")}{tr.tracking_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{trackingStatusLabel(tr.status)}</Badge>
                        {tr.tracking_url && (
                          <a href={tr.tracking_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gold hover:text-gold/80">{t("tracking_track_link")}</a>
                        )}
                      </div>
                    </div>
                    {tr.events.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-border ml-1">
                        {tr.events.map((evt, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="text-foreground">{evt.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {evt.location && `${evt.location} · `}
                              {new Date(evt.occurred_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {detail.items?.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg">{t("item_list")}</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-12 w-12 rounded object-cover" />}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="text-sm text-foreground">{formatPrice(item.unit_price * item.quantity, detail.currency_code)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {detail.shipping_address && (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg">{t("shipping_address")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{detail.shipping_address.last_name} {detail.shipping_address.first_name}</p>
              <p className="text-sm text-muted-foreground">{detail.shipping_address.address_1}</p>
              <p className="text-sm text-muted-foreground">{detail.shipping_address.city}{detail.shipping_address.province ? `, ${detail.shipping_address.province}` : ""} {detail.shipping_address.postal_code}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("order_history_title")}</h1>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : orders.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <p className="text-lg text-muted-foreground">{t("no_orders")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("no_orders_desc")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("order_id_header")}</TableHead>
                    <TableHead>{t("date_header")}</TableHead>
                    <TableHead>{t("status_header")}</TableHead>
                    <TableHead className="text-right">{t("amount_header")}</TableHead>
                    <TableHead className="text-right">{t("action_header")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.display_id}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                      <TableCell><Badge variant="outline">{statusLabel(order.status)}</Badge></TableCell>
                      <TableCell className="text-right">{formatPrice(order.total, order.currency_code)}</TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => setDetail(order)} className="text-sm text-gold hover:text-gold/80">{t("view_details")}</button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>{t("prev_page")}</Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>{t("next_page")}</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
