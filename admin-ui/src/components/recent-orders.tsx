"use client"

import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { AdminOrder } from "@/lib/admin-api"

interface RecentOrdersProps {
  orders: AdminOrder[]
  loading?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-800",
  draft: "bg-gray-100 text-gray-800",
  requires_action: "bg-orange-100 text-orange-800",
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-blue-100 text-blue-800"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        style
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

function formatCurrency(amount: number, currencyCode: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100) // Medusa stores amounts in cents
}

function SkeletonRow() {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 px-4">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </td>
    </tr>
  )
}

export function RecentOrders({ orders, loading = false }: RecentOrdersProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-6 pb-4">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <p className="text-sm text-muted-foreground">
          Latest orders from your store
        </p>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No orders yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Orders will appear here once customers start purchasing.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="py-3 px-4 font-medium">
                    #{order.display_id}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {order.customer
                      ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim() ||
                        order.email
                      : order.email || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(order.total, order.currency_code)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
