"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  useOrder,
  useCancelOrder,
  useCompleteOrder,
  useCreateRefund,
  AdminOrder,
} from "@/hooks/use-orders"
import {
  getOrderStatusBadge,
  getPaymentStatusBadge,
  getFulfillmentStatusBadge,
} from "./order-columns"
import {
  CancelOrderDialog,
  CompleteOrderDialog,
  RefundDialog,
} from "./order-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Ban,
  CheckCircle,
  RotateCcw,
  Calendar,
  Hash,
  Mail,
  Phone,
  Building,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatAddress(addr: AdminOrder["shipping_address"]) {
  if (!addr) return null
  const parts = [
    addr.address_1,
    addr.address_2,
    [addr.city, addr.province].filter(Boolean).join(", "),
    [addr.postal_code, addr.country_code?.toUpperCase()]
      .filter(Boolean)
      .join(" "),
  ].filter(Boolean)
  return parts
}

interface OrderDetailProps {
  orderId: string
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter()
  const t = useTranslations("orders")
  const { data, isLoading, isError, error } = useOrder(orderId)
  const cancelOrder = useCancelOrder()
  const completeOrder = useCompleteOrder()
  const createRefund = useCreateRefund()

  const [showCancelDialog, setShowCancelDialog] = React.useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false)
  const [showRefundDialog, setShowRefundDialog] = React.useState(false)

  const order = data?.order

  const handleCancel = async () => {
    try {
      await cancelOrder.mutateAsync(orderId)
      setShowCancelDialog(false)
    } catch {
      // Error handled by mutation
    }
  }

  const handleComplete = async () => {
    try {
      await completeOrder.mutateAsync(orderId)
      setShowCompleteDialog(false)
    } catch {
      // Error handled by mutation
    }
  }

  const handleRefund = async (paymentId: string, amount: number) => {
    try {
      await createRefund.mutateAsync({
        payment_id: paymentId,
        amount,
        order_id: orderId,
      })
      setShowRefundDialog(false)
    } catch {
      // Error handled by mutation
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !order) {
    return (
      <div className="space-y-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detail.backToOrders")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("detail.orderNotFound")}
          </p>
        </div>
      </div>
    )
  }

  const canCancel = order.status !== "canceled" && order.status !== "completed"
  const canComplete = order.status !== "canceled" && order.status !== "completed"
  const canRefund = order.status !== "canceled"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {t("orderPrefix", { id: order.display_id })}
              </h1>
              {getOrderStatusBadge(order.status, t)}
            </div>
            <p className="text-muted-foreground mt-1">
              {t("placedOn", {
                date: format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a"),
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canComplete && (
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("detail.complete")}
            </Button>
          )}
          {canRefund && (
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("detail.refund")}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              {t("detail.cancel")}
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges Row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("columns.payment")}:</span>
          {getPaymentStatusBadge(order.payment_status, t) || (
            <Badge variant="outline">{t("paymentStatus.unknown")}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("columns.fulfillment")}:</span>
          {getFulfillmentStatusBadge(order.fulfillment_status, t) || (
            <Badge variant="outline">{t("fulfillmentStatus.unknown")}</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("detail.sections.items")}
              {order.items && (
                <Badge variant="secondary">{order.items.length}</Badge>
              )}
            </h2>

            {!order.items || order.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("detail.items.noItems")}
              </p>
            ) : (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-md border p-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.product_title || item.title}
                      </p>
                      {item.variant_title && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("detail.items.variant", { name: item.variant_title })}
                        </p>
                      )}
                      {item.variant_sku && (
                        <p className="text-xs text-muted-foreground">
                          {t("detail.items.sku", { sku: item.variant_sku })}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(item.unit_price, order.currency_code)} x{" "}
                        {item.quantity}
                      </p>
                    </div>
                    {/* Item total */}
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatCurrency(item.total, order.currency_code)}
                      </p>
                      {item.discount_total && item.discount_total > 0 ? (
                        <p className="text-xs text-green-600">
                          {t("detail.items.discount", { amount: formatCurrency(item.discount_total, order.currency_code) })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("detail.summary.subtotal")}</span>
                    <span>
                      {formatCurrency(order.subtotal, order.currency_code)}
                    </span>
                  </div>
                  {order.shipping_total > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detail.summary.shipping")}</span>
                      <span>
                        {formatCurrency(
                          order.shipping_total,
                          order.currency_code
                        )}
                      </span>
                    </div>
                  )}
                  {order.tax_total > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detail.summary.tax")}</span>
                      <span>
                        {formatCurrency(order.tax_total, order.currency_code)}
                      </span>
                    </div>
                  )}
                  {order.discount_total > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detail.summary.discount")}</span>
                      <span className="text-green-600">
                        -{formatCurrency(
                          order.discount_total,
                          order.currency_code
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-semibold text-base border-t pt-2">
                    <span>{t("detail.summary.total")}</span>
                    <span>
                      {formatCurrency(order.total, order.currency_code)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fulfillments */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {t("detail.sections.fulfillments")}
              {order.fulfillments && order.fulfillments.length > 0 && (
                <Badge variant="secondary">{order.fulfillments.length}</Badge>
              )}
            </h2>

            {!order.fulfillments || order.fulfillments.length === 0 ? (
              <div className="flex items-center gap-3 rounded-md bg-muted/50 p-4">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("detail.fulfillments.noFulfillments")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {order.fulfillments.map((ful, idx) => (
                  <div key={ful.id} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {t("detail.fulfillments.fulfillmentNumber", { number: idx + 1 })}
                      </p>
                      {ful.canceled_at ? (
                        <Badge variant="destructive">{t("detail.fulfillments.canceled")}</Badge>
                      ) : ful.delivered_at ? (
                        <Badge variant="success">{t("detail.fulfillments.delivered")}</Badge>
                      ) : ful.shipped_at ? (
                        <Badge className="border-transparent bg-blue-100 text-blue-800">
                          {t("detail.fulfillments.shipped")}
                        </Badge>
                      ) : (
                        <Badge variant="warning">{t("detail.fulfillments.processing")}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        {t("detail.fulfillments.created", {
                          date: format(new Date(ful.created_at), "MMM d, yyyy h:mm a"),
                        })}
                      </p>
                      {ful.shipped_at && (
                        <p>
                          {t("detail.fulfillments.shippedDate", {
                            date: format(new Date(ful.shipped_at), "MMM d, yyyy h:mm a"),
                          })}
                        </p>
                      )}
                      {ful.delivered_at && (
                        <p>
                          {t("detail.fulfillments.deliveredDate", {
                            date: format(new Date(ful.delivered_at), "MMM d, yyyy h:mm a"),
                          })}
                        </p>
                      )}
                    </div>
                    {/* Tracking */}
                    {ful.labels && ful.labels.length > 0 && (
                      <div className="space-y-1">
                        {ful.labels.map((label, li) => (
                          <div key={li} className="text-xs">
                            {label.tracking_number && (
                              <span className="text-muted-foreground">
                                {t("detail.fulfillments.tracking", { number: label.tracking_number })}
                              </span>
                            )}
                            {label.tracking_url && (
                              <a
                                href={label.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline ml-2"
                              >
                                {t("detail.fulfillments.track")}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Items */}
                    {ful.items && ful.items.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">
                          {t("detail.fulfillments.fulfilledItems")}
                        </p>
                        {ful.items.map((fi, fii) => (
                          <p key={fii}>
                            {fi.title || "Item"} x {fi.quantity}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("detail.sections.payment")}
            </h2>

            {!order.payment_collections ||
            order.payment_collections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("detail.payment.noPaymentInfo")}
              </p>
            ) : (
              <div className="space-y-3">
                {order.payment_collections.map((pc) => (
                  <div key={pc.id} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {t("detail.payment.collection")}{" "}
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">
                          {pc.id.slice(0, 16)}...
                        </code>
                      </p>
                      <Badge
                        variant={
                          pc.status === "authorized" || pc.status === "captured"
                            ? "success"
                            : pc.status === "canceled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {pc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detail.payment.amount")}</span>
                      <span className="font-medium">
                        {formatCurrency(
                          pc.amount,
                          pc.currency_code || order.currency_code
                        )}
                      </span>
                    </div>

                    {pc.payments && pc.payments.length > 0 && (
                      <div className="space-y-2 border-t pt-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("detail.payment.payments")}
                        </p>
                        {pc.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              {payment.provider_id && (
                                <p className="text-muted-foreground">
                                  {t("detail.payment.provider", { name: payment.provider_id })}
                                </p>
                              )}
                              <p className="text-muted-foreground">
                                {format(
                                  new Date(payment.created_at),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                {formatCurrency(
                                  payment.amount,
                                  payment.currency_code
                                )}
                              </p>
                              {payment.captured_at && (
                                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                                  {t("detail.payment.captured")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("detail.sections.customer")}
            </h2>

            {order.customer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {(order.customer.first_name?.[0] || "")
                        .concat(order.customer.last_name?.[0] || "")
                        .toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {[order.customer.first_name, order.customer.last_name]
                        .filter(Boolean)
                        .join(" ") || t("detail.customer.guest")}
                    </p>
                    {order.customer.has_account !== undefined && (
                      <Badge
                        variant={
                          order.customer.has_account ? "success" : "secondary"
                        }
                        className="text-[10px] mt-0.5"
                      >
                        {order.customer.has_account
                          ? t("detail.customer.registered")
                          : t("detail.customer.guest")}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {order.customer.email || order.email || "-"}
                    </span>
                  </div>
                  {order.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {order.customer.phone}
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/customers/${order.customer.id}`}
                  className="text-sm text-primary hover:underline block"
                >
                  {t("detail.customer.viewProfile")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {order.email || "-"}
                  </span>
                </div>
                <p className="text-muted-foreground italic">{t("detail.customer.guestCheckout")}</p>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("detail.sections.shippingAddress")}
            </h2>

            {order.shipping_address ? (
              <div className="space-y-2 text-sm">
                {(order.shipping_address.first_name ||
                  order.shipping_address.last_name) && (
                  <p className="font-medium">
                    {[
                      order.shipping_address.first_name,
                      order.shipping_address.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {order.shipping_address.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {order.shipping_address.company}
                    </span>
                  </div>
                )}
                {formatAddress(order.shipping_address)?.map((line, i) => (
                  <p key={i} className="text-muted-foreground">
                    {line}
                  </p>
                ))}
                {order.shipping_address.phone && (
                  <div className="flex items-center gap-2 mt-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {order.shipping_address.phone}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.address.noShippingAddress")}
              </p>
            )}
          </div>

          {/* Billing Address */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("detail.sections.billingAddress")}
            </h2>

            {order.billing_address ? (
              <div className="space-y-2 text-sm">
                {(order.billing_address.first_name ||
                  order.billing_address.last_name) && (
                  <p className="font-medium">
                    {[
                      order.billing_address.first_name,
                      order.billing_address.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {order.billing_address.company && (
                  <p className="text-muted-foreground">
                    {order.billing_address.company}
                  </p>
                )}
                {formatAddress(order.billing_address)?.map((line, i) => (
                  <p key={i} className="text-muted-foreground">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.address.sameAsShipping")}
              </p>
            )}
          </div>

          {/* Order Meta */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">{t("detail.sections.orderInfo")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> {t("detail.orderMeta.orderId")}
                </span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded break-all max-w-[140px] text-right">
                  {order.id}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {t("detail.orderMeta.created")}
                </span>
                <span>
                  {format(new Date(order.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {t("detail.orderMeta.updated")}
                </span>
                <span>
                  {format(new Date(order.updated_at), "MMM d, yyyy")}
                </span>
              </div>
              {order.region && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.orderMeta.region")}</span>
                  <span>{order.region.name || order.region.id}</span>
                </div>
              )}
              {order.sales_channel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.orderMeta.salesChannel")}</span>
                  <span>
                    {order.sales_channel.name || order.sales_channel.id}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("detail.orderMeta.currency")}</span>
                <span className="uppercase">{order.currency_code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CancelOrderDialog
        order={order}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
        isLoading={cancelOrder.isPending}
      />
      <CompleteOrderDialog
        order={order}
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onConfirm={handleComplete}
        isLoading={completeOrder.isPending}
      />
      <RefundDialog
        order={order}
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        onConfirm={handleRefund}
        isLoading={createRefund.isPending}
      />
    </div>
  )
}
