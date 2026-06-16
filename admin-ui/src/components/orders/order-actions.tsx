"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
} from "@/components/ui/select"
import { AdminOrder, useCarriers, useCreateShipment, useCreateTrackingRecord, useCreateFulfillment } from "@/hooks/use-orders"
import { AdminOrderFulfillment } from "@/lib/admin-api"
import { AlertTriangle, Ban, CheckCircle, RotateCcw, Truck, Package } from "lucide-react"
import { useTranslations } from "next-intl"

// ---- Cancel Order Dialog ----

interface CancelOrderDialogProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export function CancelOrderDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CancelOrderDialogProps) {
  const t = useTranslations("orders")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            {t("dialogs.cancel.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogs.cancel.description", { id: String(order?.display_id) })}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{t("dialogs.cancel.warning")}</p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("dialogs.cancel.keepOrder")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("dialogs.cancel.canceling") : t("dialogs.cancel.cancelOrder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Complete Order Dialog ----

interface CompleteOrderDialogProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isLoading: boolean
  isPickup?: boolean
}

export function CompleteOrderDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  isPickup = false,
}: CompleteOrderDialogProps) {
  const t = useTranslations("orders")
  const title = isPickup ? t("dialogs.pickupComplete.title") : t("dialogs.complete.title")
  const description = isPickup
    ? t("dialogs.pickupComplete.description", { id: String(order?.display_id) })
    : t("dialogs.complete.description", { id: String(order?.display_id) })
  const confirmLabel = isPickup
    ? t("dialogs.pickupComplete.confirm")
    : t("dialogs.complete.completeOrder")
  const loadingLabel = isPickup
    ? t("dialogs.pickupComplete.processing")
    : t("dialogs.complete.completing")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("dialogs.complete.cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Refund Dialog ----

interface RefundDialogProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (paymentId: string, amount: number) => Promise<void>
  isLoading: boolean
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export function RefundDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RefundDialogProps) {
  const t = useTranslations("orders")
  const [amount, setAmount] = React.useState("")
  const [error, setError] = React.useState("")

  // Find the first captured payment
  const capturedPayment = React.useMemo(() => {
    if (!order?.payment_collections) return null
    for (const pc of order.payment_collections) {
      if (pc.payments) {
        const captured = pc.payments.find((p) => p.captured_at && !p.canceled_at)
        if (captured) return captured
      }
    }
    return null
  }, [order])

  const maxRefundAmount = capturedPayment
    ? capturedPayment.amount / 100
    : order
      ? order.total / 100
      : 0

  React.useEffect(() => {
    if (open) {
      setAmount(String(maxRefundAmount))
      setError("")
    }
  }, [open, maxRefundAmount])

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t("dialogs.refund.invalidAmount"))
      return
    }
    if (numAmount > maxRefundAmount) {
      setError(
        t("dialogs.refund.exceedsMax", {
          amount: formatCurrency(maxRefundAmount * 100, order?.currency_code || "usd"),
        })
      )
      return
    }
    if (!capturedPayment) {
      setError(t("dialogs.refund.noCapturedPayment"))
      return
    }
    setError("")
    await onConfirm(capturedPayment.id, Math.round(numAmount * 100))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            {t("dialogs.refund.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogs.refund.description", { id: String(order?.display_id) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {capturedPayment ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("dialogs.refund.paymentId")}</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs">
                  {capturedPayment.id.slice(0, 20)}...
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("dialogs.refund.maxRefundable")}
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    maxRefundAmount * 100,
                    order?.currency_code || "usd"
                  )}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refund-amount">{t("dialogs.refund.refundAmountLabel")}</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundAmount}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setError("")
                  }}
                  placeholder={t("dialogs.refund.refundAmountPlaceholder")}
                />
              </div>
            </>
          ) : (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{t("dialogs.refund.noPaymentFound")}</p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("dialogs.refund.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !capturedPayment}
          >
            {isLoading ? t("dialogs.refund.processing") : t("dialogs.refund.issueRefund")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Create Shipment Dialog (mark as shipped + enter tracking) ----

interface CreateShipmentDialogProps {
  order: AdminOrder | null
  fulfillment: AdminOrderFulfillment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateShipmentDialog({
  order,
  fulfillment,
  open,
  onOpenChange,
}: CreateShipmentDialogProps) {
  const t = useTranslations("orders")
  const createShipment = useCreateShipment()
  const createTracking = useCreateTrackingRecord()
  const { data: carriersData } = useCarriers()

  const [carrier, setCarrier] = React.useState("")
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [trackingUrl, setTrackingUrl] = React.useState("")
  const [error, setError] = React.useState("")

  const carriers = carriersData?.carriers || []

  React.useEffect(() => {
    if (open) {
      setCarrier("")
      setTrackingNumber("")
      setTrackingUrl("")
      setError("")
    }
  }, [open])

  React.useEffect(() => {
    if (carrier && trackingNumber) {
      const selected = carriers.find((c) => c.id === carrier)
      if (selected?.trackingUrlTemplate) {
        setTrackingUrl(
          selected.trackingUrlTemplate.replace("{number}", encodeURIComponent(trackingNumber))
        )
      }
    }
  }, [carrier, trackingNumber, carriers])

  const handleSubmit = async () => {
    if (!order || !fulfillment) return
    if (!trackingNumber.trim()) {
      setError(t("dialogs.shipment.trackingRequired"))
      return
    }
    if (!carrier) {
      setError(t("dialogs.shipment.carrierRequired"))
      return
    }

    setError("")

    try {
      await createShipment.mutateAsync({
        order_id: order.id,
        fulfillment_id: fulfillment.id,
        labels: [{
          tracking_number: trackingNumber.trim(),
          tracking_url: trackingUrl.trim() || "",
          label_url: "",
        }],
      })

      const selectedCarrier = carriers.find((c) => c.id === carrier)
      await createTracking.mutateAsync({
        fulfillment_id: fulfillment.id,
        tracking_number: trackingNumber.trim(),
        carrier: carrier,
        carrier_name: selectedCarrier?.name || carrier,
        tracking_url: trackingUrl.trim() || undefined,
      })

      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || t("dialogs.shipment.error"))
    }
  }

  const isLoading = createShipment.isPending || createTracking.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            {t("dialogs.shipment.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogs.shipment.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("dialogs.shipment.carrier")}</Label>
            <Select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="">{t("dialogs.shipment.selectCarrier")}</option>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking-number">{t("dialogs.shipment.trackingNumber")}</Label>
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value)
                setError("")
              }}
              placeholder={t("dialogs.shipment.trackingPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking-url">{t("dialogs.shipment.trackingUrl")}</Label>
            <Input
              id="tracking-url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder={t("dialogs.shipment.urlPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("dialogs.shipment.urlAutoGenerated")}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("dialogs.shipment.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t("dialogs.shipment.processing") : t("dialogs.shipment.confirmShipment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Fulfill Order Dialog ----

interface FulfillOrderDialogProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (params: {
    carrier: string
    carrierName: string
    trackingNumber: string
    trackingUrl: string
  }) => Promise<void>
  isLoading: boolean
}

export function FulfillOrderDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: FulfillOrderDialogProps) {
  const t = useTranslations("orders")
  const { data: carriersData } = useCarriers()

  const [carrier, setCarrier] = React.useState("")
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [trackingUrl, setTrackingUrl] = React.useState("")
  const [error, setError] = React.useState("")

  const carriers = carriersData?.carriers || []

  React.useEffect(() => {
    if (open) {
      setCarrier("")
      setTrackingNumber("")
      setTrackingUrl("")
      setError("")
    }
  }, [open])

  React.useEffect(() => {
    if (carrier && trackingNumber) {
      const selected = carriers.find((c) => c.id === carrier)
      if (selected?.trackingUrlTemplate) {
        setTrackingUrl(
          selected.trackingUrlTemplate.replace("{number}", encodeURIComponent(trackingNumber))
        )
      }
    }
  }, [carrier, trackingNumber, carriers])

  const unfulfilledItems = React.useMemo(() => {
    if (!order?.items) return []
    return order.items.filter((item) => {
      const fulfilledQty = (item as any).detail?.fulfilled_quantity ?? 0
      return item.quantity - fulfilledQty > 0
    })
  }, [order])

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      setError(t("dialogs.shipment.trackingRequired"))
      return
    }
    if (!carrier) {
      setError(t("dialogs.shipment.carrierRequired"))
      return
    }
    setError("")
    try {
      const selectedCarrier = carriers.find((c) => c.id === carrier)
      await onConfirm({
        carrier,
        carrierName: selectedCarrier?.name || carrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
      })
    } catch (err: any) {
      setError(err?.message || t("dialogs.shipment.error"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            {t("dialogs.fulfill.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialogs.fulfill.description", { id: String(order?.display_id) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("dialogs.fulfill.itemsToFulfill")}</p>
            {unfulfilledItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div className="flex items-center gap-3">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.title} className="h-10 w-10 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{item.product_title || item.title}</p>
                    {item.variant_title && (
                      <p className="text-xs text-muted-foreground">{item.variant_title}</p>
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground">x{item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="space-y-2">
              <Label>{t("dialogs.shipment.carrier")}</Label>
              <Select
                value={carrier}
                onChange={(e) => { setCarrier(e.target.value); setError("") }}
              >
                <option value="">{t("dialogs.shipment.selectCarrier")}</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfill-tracking">{t("dialogs.shipment.trackingNumber")}</Label>
              <Input
                id="fulfill-tracking"
                value={trackingNumber}
                onChange={(e) => { setTrackingNumber(e.target.value); setError("") }}
                placeholder={t("dialogs.shipment.trackingPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfill-tracking-url">{t("dialogs.shipment.trackingUrl")}</Label>
              <Input
                id="fulfill-tracking-url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder={t("dialogs.shipment.urlPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("dialogs.shipment.urlAutoGenerated")}</p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("dialogs.fulfill.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || unfulfilledItems.length === 0}>
            {isLoading ? t("dialogs.fulfill.processing") : t("dialogs.fulfill.confirmFulfill")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
