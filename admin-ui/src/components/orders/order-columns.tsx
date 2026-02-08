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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export function getOrderStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>
    case "pending":
      return <Badge variant="warning">Pending</Badge>
    case "canceled":
      return <Badge variant="destructive">Canceled</Badge>
    case "archived":
      return <Badge variant="secondary">Archived</Badge>
    case "requires_action":
      return <Badge variant="warning">Action Required</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function getPaymentStatusBadge(status?: string) {
  switch (status) {
    case "captured":
    case "paid":
      return <Badge variant="success">Paid</Badge>
    case "awaiting":
    case "authorized":
      return <Badge variant="warning">Awaiting</Badge>
    case "refunded":
      return <Badge variant="secondary">Refunded</Badge>
    case "partially_refunded":
      return <Badge variant="outline">Partial Refund</Badge>
    case "canceled":
    case "not_paid":
      return <Badge variant="destructive">Not Paid</Badge>
    default:
      return status ? <Badge variant="outline">{status}</Badge> : null
  }
}

export function getFulfillmentStatusBadge(status?: string) {
  switch (status) {
    case "fulfilled":
    case "delivered":
      return <Badge variant="success">Fulfilled</Badge>
    case "shipped":
      return (
        <Badge className="border-transparent bg-blue-100 text-blue-800">
          Shipped
        </Badge>
      )
    case "partially_fulfilled":
    case "partially_shipped":
      return <Badge variant="warning">Partial</Badge>
    case "not_fulfilled":
      return <Badge variant="secondary">Unfulfilled</Badge>
    case "canceled":
      return <Badge variant="destructive">Canceled</Badge>
    default:
      return status ? <Badge variant="outline">{status}</Badge> : null
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export function getOrderColumns(): ColumnDef<AdminOrder>[] {
  return [
    {
      accessorKey: "display_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Order
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
      header: "Customer",
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
      header: "Status",
      cell: ({ row }) => getOrderStatusBadge(row.original.status),
      size: 130,
    },
    {
      id: "payment",
      header: "Payment",
      cell: ({ row }) =>
        getPaymentStatusBadge(row.original.payment_status) || (
          <span className="text-sm text-muted-foreground">-</span>
        ),
      size: 130,
    },
    {
      id: "fulfillment",
      header: "Fulfillment",
      cell: ({ row }) =>
        getFulfillmentStatusBadge(row.original.fulfillment_status) || (
          <span className="text-sm text-muted-foreground">-</span>
        ),
      size: 130,
    },
    {
      id: "items",
      header: "Items",
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
          Total
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
          Date
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
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/orders/${order.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
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
