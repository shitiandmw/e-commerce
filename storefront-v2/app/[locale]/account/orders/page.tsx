"use client"

import { useEffect, useState, useCallback } from "react"
import { authFetch } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useTranslations } from "next-intl"
import { getOrderDeliverySnapshot } from "@/lib/order-delivery-snapshot"

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

interface ShippingAddress {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

interface ShippingMethod {
  id?: string
  name?: string | null
  amount?: number
  shipping_option_id?: string | null
  metadata?: { type?: unknown; [key: string]: unknown } | null
  shipping_option?: {
    name?: string | null
    metadata?: { type?: unknown; [key: string]: unknown } | null
  } | null
}

interface Order {
  id: string
  display_id: number
  created_at: string
  status: string
  total: number
  currency_code: string
  items: OrderItem[]
  email?: string | null
  shipping_address?: ShippingAddress | null
  shipping_methods?: ShippingMethod[]
  payment_status?: string
  fulfillment_status?: string
  metadata?: Record<string, unknown> | null
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
  const getPrimaryShippingMethod = (order: Order) => order.shipping_methods?.[0] ?? null
  const getRawShippingMethodName = (order: Order) => {
    const snapshot = getOrderDeliverySnapshot(order)
    if (snapshot) return snapshot.shipping_option.name
    const method = getPrimaryShippingMethod(order)
    const pickupName = order.shipping_address?.address_1 === "Pickup Order"
      ? order.shipping_address?.address_2
      : ""
    return method?.name || method?.shipping_option?.name || pickupName || ""
  }
  const getShippingMethodName = (order: Order) => getRawShippingMethodName(order) || t("no_shipping_method")
  const isPickupOrder = (order: Order) => {
    const snapshot = getOrderDeliverySnapshot(order)
    if (snapshot) return snapshot.shipping_option.type === "pickup"
    const method = getPrimaryShippingMethod(order)
    const metadataType = method?.metadata?.type ?? method?.shipping_option?.metadata?.type
    const methodName = getRawShippingMethodName(order).toLowerCase()
    return String(metadataType || "").toLowerCase() === "pickup"
      || order.shipping_address?.address_1 === "Pickup Order"
      || methodName.includes("pickup")
      || methodName.includes("pick-up")
      || methodName.includes("self-pick")
      || methodName.includes("自提")
      || methodName.includes("自取")
  }
  const deliveryTypeLabel = (order: Order) => (
    isPickupOrder(order) ? t("delivery_type_pickup") : t("delivery_type_shipping")
  )
  const hasSpecificShippingMethod = (order: Order) => {
    const methodName = getRawShippingMethodName(order).trim().toLowerCase()
    if (!methodName) return false

    const genericNames = isPickupOrder(order)
      ? ["pickup", "pick-up", "self-pick", "自提", "自取"]
      : ["shipping", "delivery", "物流配送", "配送"]

    return !genericNames.some((name) => methodName === name)
  }
  const getContactName = (order: Order) => {
    const firstName = order.shipping_address?.first_name?.trim()
    const lastName = order.shipping_address?.last_name?.trim()
    return [lastName, firstName].filter(Boolean).join(" ") || "-"
  }
  const getContactPhone = (order: Order) => order.shipping_address?.phone?.trim() || ""
  const formatAddressLines = (address?: ShippingAddress | null) => {
    if (!address) return []
    return [
      [address.address_1, address.address_2].filter(Boolean).join(" "),
      [address.city, address.province, address.postal_code].filter(Boolean).join(", "),
      address.country_code,
    ].filter(Boolean)
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/account/orders?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setTotal(data.count || 0)
      }
    } catch { /* empty */ }
    setLoading(false)
  }, [page])

  useEffect(() => { loadOrders() }, [loadOrders])

  const openDetail = useCallback(async (order: Order) => {
    setDetail(order)
    try {
      const res = await authFetch(`/api/account/orders/${order.id}`)
      if (res.ok) {
        const data = await res.json() as { order?: Order }
        if (data.order) setDetail(data.order)
      }
    } catch { /* empty */ }
  }, [])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo[]>([])
  const [trackingLoading, setTrackingLoading] = useState(false)

  const loadTracking = useCallback(async (orderId: string) => {
    setTrackingLoading(true)
    try {
      const res = await authFetch(`/api/account/orders/${orderId}/tracking`)
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
    const detailContactName = getContactName(detail)
    const detailContactPhone = getContactPhone(detail)
    const detailHasContact = detailContactName !== "-" || Boolean(detail.email) || Boolean(detailContactPhone)
    const detailIsPickup = isPickupOrder(detail)
    const detailAddressLines = formatAddressLines(detail.shipping_address)
    const detailShippingMethodName = getShippingMethodName(detail)
    const detailHasSpecificShippingMethod = hasSpecificShippingMethod(detail)
    const deliverySnapshot = getOrderDeliverySnapshot(detail)

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
              <div><span className="text-muted-foreground">{t("delivery_type_label")}</span><Badge variant="outline">{deliveryTypeLabel(detail)}</Badge></div>
              <div><span className="text-muted-foreground">{t("total_label")}</span>{formatPrice(detail.total, detail.currency_code)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">{t("contact_info")}</CardTitle></CardHeader>
          <CardContent>
            {detailHasContact ? (
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {detailContactName !== "-" && (
                  <div><span className="text-muted-foreground">{t("contact_name_label")}</span>{detailContactName}</div>
                )}
                {detail.email && (
                  <div><span className="text-muted-foreground">{t("email_label")}</span>{detail.email}</div>
                )}
                {detailContactPhone && (
                  <div><span className="text-muted-foreground">{t("phone_label")}</span>{detailContactPhone}</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("no_contact_info")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">{t("delivery_info")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">{t("delivery_type_label")}</span>{deliveryTypeLabel(detail)}</div>
              {detailHasSpecificShippingMethod && (
                <div><span className="text-muted-foreground">{t("shipping_method_label")}</span>{detailShippingMethodName}</div>
              )}
              {detailIsPickup ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-gold/20 bg-gold/5 p-3 text-sm text-foreground">
                    <p>{t("pickup_order_notice")}</p>
                    {deliverySnapshot?.pickup_location && (
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {deliverySnapshot.pickup_location.name}
                        </p>
                        <p>{deliverySnapshot.pickup_location.address}</p>
                        {deliverySnapshot.pickup_location.hours && (
                          <p>{deliverySnapshot.pickup_location.hours}</p>
                        )}
                        {deliverySnapshot.pickup_location.phone && (
                          <p>{deliverySnapshot.pickup_location.phone}</p>
                        )}
                        {deliverySnapshot.pickup_location.note && (
                          <div className="leading-relaxed [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-1">
                            <span className="font-medium text-foreground/80">
                              {t("pickup_location_note")}:
                            </span>{" "}
                            <div
                              dangerouslySetInnerHTML={{
                                __html: deliverySnapshot.pickup_location.note,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : detail.shipping_address ? (
                <div>
                  <p className="mb-1 font-medium text-foreground">{detailContactName}</p>
                  {detailAddressLines.map((line, index) => (
                    <p key={index} className="text-muted-foreground">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t("no_shipping_address")}</p>
              )}
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
                    <TableHead>{t("delivery_header")}</TableHead>
                    <TableHead>{t("contact_header")}</TableHead>
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
                      <TableCell className="whitespace-normal">
                        <div className="flex min-w-36 flex-col gap-1">
                          <Badge variant="outline" className="w-fit">{deliveryTypeLabel(order)}</Badge>
                          {hasSpecificShippingMethod(order) && (
                            <span className="text-xs text-muted-foreground">{getShippingMethodName(order)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex min-w-40 flex-col gap-1 text-xs">
                          <span className="text-foreground">{getContactName(order)}</span>
                          {getContactPhone(order) && <span className="text-muted-foreground">{getContactPhone(order)}</span>}
                          {order.email && <span className="text-muted-foreground">{order.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(order.total, order.currency_code)}</TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => openDetail(order)} className="text-sm text-gold hover:text-gold/80">{t("view_details")}</button>
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
