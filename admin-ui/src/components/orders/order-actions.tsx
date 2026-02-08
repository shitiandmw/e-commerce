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
import { AdminOrder } from "@/hooks/use-orders"
import { AlertTriangle, Ban, CheckCircle, Truck, RotateCcw } from "lucide-react"

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel order{" "}
            <strong>#{order?.display_id}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Canceling this order will void any pending payments and prevent
              further fulfillment. If the payment has already been captured, you
              may need to issue a refund separately.
            </p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Canceling..." : "Cancel Order"}
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
}

export function CompleteOrderDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CompleteOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Complete Order
          </DialogTitle>
          <DialogDescription>
            Mark order <strong>#{order?.display_id}</strong> as completed? This
            indicates the order has been fully processed and delivered.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Completing..." : "Complete Order"}
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
      setError("Please enter a valid refund amount.")
      return
    }
    if (numAmount > maxRefundAmount) {
      setError(
        `Amount exceeds the maximum refundable amount of ${formatCurrency(maxRefundAmount * 100, order?.currency_code || "usd")}.`
      )
      return
    }
    if (!capturedPayment) {
      setError("No captured payment found for this order.")
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
            Refund Order
          </DialogTitle>
          <DialogDescription>
            Issue a refund for order <strong>#{order?.display_id}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {capturedPayment ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment ID</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs">
                  {capturedPayment.id.slice(0, 20)}...
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Max Refundable Amount
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    maxRefundAmount * 100,
                    order?.currency_code || "usd"
                  )}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount ($)</Label>
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
                  placeholder="Enter refund amount"
                />
              </div>
            </>
          ) : (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  No captured payment found for this order. Refund is not
                  available.
                </p>
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
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !capturedPayment}
          >
            {isLoading ? "Processing..." : "Issue Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
