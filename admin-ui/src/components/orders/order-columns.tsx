"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AdminOrder } from "@/hooks/use-orders"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type TranslationFn = (key: string, values?: Record<string, string | number | Date>) => string

export function getOrderStatusBadge(status: string, t?: TranslationFn) {
  const labels: Record<string, { label: string; variant: string }> = {
    completed: { label: t ? t("status.completed") : "Completed", variant: "success" },
    pending: { label: t ? t("status.pending") : "Pending", variant: "warning" },
    canceled: { label: t ? t("status.canceled") : "Canceled", variant: "destructive" },
    archived: { label: t ? t("status.archived") : "Archived", variant: "secondary" },
    requires_action: { label: t ? t("status.requiresAction") : "Action Required", variant: "warning" },
  }

  const info = labels[status]
  if (info) {
    return <Badge variant={info.variant as "success" | "warning" | "destructive" | "secondary"}>{info.label}</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

export function getPaymentStatusBadge(status?: string, t?: TranslationFn) {
  if (!status) return null
  const labels: Record<string, { label: string; variant: string }> = {
    captured: { label: t ? t("paymentStatus.paid") : "Paid", variant: "success" },
    paid: { label: t ? t("paymentStatus.paid") : "Paid", variant: "success" },
    awaiting: { label: t ? t("paymentStatus.awaiting") : "Awaiting", variant: "warning" },
    authorized: { label: t ? t("paymentStatus.awaiting") : "Awaiting", variant: "warning" },
    refunded: { label: t ? t("paymentStatus.refunded") : "Refunded", variant: "secondary" },
    partially_refunded: { label: t ? t("paymentStatus.partialRefund") : "Partial Refund", variant: "outline" },
    canceled: { label: t ? t("paymentStatus.notPaid") : "Not Paid", variant: "destructive" },
    not_paid: { label: t ? t("paymentStatus.notPaid") : "Not Paid", variant: "destructive" },
  }

  const info = labels[status]
  if (info) {
    return <Badge variant={info.variant as "success" | "warning" | "secondary" | "outline" | "destructive"}>{info.label}</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

export function getFulfillmentStatusBadge(status?: string, t?: TranslationFn) {
  if (!status) return null
  switch (status) {
    case "fulfilled":
    case "delivered":
      return <Badge variant="success">{t ? t("fulfillmentStatus.fulfilled") : "Fulfilled"}</Badge>
    case "shipped":
      return (
        <Badge className="border-transparent bg-blue-100 text-blue-800">
          {t ? t("fulfillmentStatus.shipped") : "Shipped"}
        </Badge>
      )
    case "partially_fulfilled":
    case "partially_shipped":
      return <Badge variant="warning">{t ? t("fulfillmentStatus.partial") : "Partial"}</Badge>
    case "not_fulfilled":
      return <Badge variant="secondary">{t ? t("fulfillmentStatus.unfulfilled") : "Unfulfilled"}</Badge>
    case "canceled":
      return <Badge variant="destructive">{t ? t("fulfillmentStatus.canceled") : "Canceled"}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatCurrency(amount: number, currency: string) {
  const cur = (currency || "USD").toUpperCase()
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
  }).format(amount / 100)
}

export function getOrderColumns(t: TranslationFn): ColumnDef<AdminOrder>[] {
  return [
    {
      accessorKey: "display_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.order")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/orders/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          #{row.original.display_id}
        </Link>
      ),
      size: 100,
    },
    {
      id: "customer",
      header: t("columns.customer"),
      cell: ({ row }) => {
        const order = row.original
        const name = order.customer
          ? [order.customer.first_name, order.customer.last_name]
              .filter(Boolean)
              .join(" ")
          : null
        return (
          <div className="max-w-[200px]">
            {name && <p className="text-sm font-medium truncate">{name}</p>}
            <p className="text-xs text-muted-foreground truncate">
              {order.email || order.customer?.email || "-"}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => getOrderStatusBadge(row.original.status, t),
      size: 130,
    },
    {
      id: "payment",
      header: t("columns.payment"),
      cell: ({ row }) =>
        getPaymentStatusBadge(row.original.payment_status, t) || (
          <span className="text-sm text-muted-foreground">-</span>
        ),
      size: 130,
    },
    {
      id: "fulfillment",
      header: t("columns.fulfillment"),
      cell: ({ row }) =>
        getFulfillmentStatusBadge(row.original.fulfillment_status, t) || (
          <span className="text-sm text-muted-foreground">-</span>
        ),
      size: 130,
    },
    {
      id: "items",
      header: t("columns.items"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.items?.reduce((acc, item) => acc + item.quantity, 0) ||
            0}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.total")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.total, row.original.currency_code)}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.date")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.created_at), "MMM d, yyyy")}
        </span>
      ),
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("table.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/orders/${order.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("table.viewDetails")}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]
}
