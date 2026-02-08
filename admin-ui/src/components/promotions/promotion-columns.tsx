"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Promotion } from "@/hooks/use-promotions"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { format } from "date-fns"

function getTypeBadge(type: Promotion["type"]) {
  switch (type) {
    case "standard":
      return <Badge variant="secondary">Standard</Badge>
    case "buyget":
      return <Badge variant="warning">Buy X Get Y</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getStatusInfo(promotion: Promotion) {
  const now = new Date()
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    return <Badge variant="destructive">Expired</Badge>
  }
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    return <Badge variant="warning">Scheduled</Badge>
  }
  return <Badge variant="success">Active</Badge>
}

function formatDiscount(promotion: Promotion) {
  const method = promotion.application_method
  if (!method) return "-"
  if (method.type === "percentage") {
    return `${method.value}%`
  }
  const currency = method.currency_code?.toUpperCase() || "USD"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(method.value)
}

export function getPromotionColumns(
  onDelete: (promotion: Promotion) => void
): ColumnDef<Promotion>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/promotions/${row.original.id}`}
          className="font-medium font-mono hover:underline"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      id: "discount",
      header: "Discount",
      cell: ({ row }) => (
        <span className="text-sm">{formatDiscount(row.original)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => getStatusInfo(row.original),
    },
    {
      id: "automatic",
      header: "Automatic",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.is_automatic ? "Yes" : "No"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const promotion = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/promotions/${promotion.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              </Link>
              <Link href={`/promotions/${promotion.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(promotion)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]
}
