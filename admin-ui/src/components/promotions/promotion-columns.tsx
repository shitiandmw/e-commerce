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

function getTypeBadge(type: Promotion["type"], t: (key: string) => string) {
  switch (type) {
    case "standard":
      return <Badge variant="secondary">{t("type.standard")}</Badge>
    case "buyget":
      return <Badge variant="warning">{t("type.buyget")}</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getStatusInfo(promotion: Promotion, t: (key: string) => string) {
  const now = new Date()
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    return <Badge variant="destructive">{t("status.expired")}</Badge>
  }
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    return <Badge variant="warning">{t("status.scheduled")}</Badge>
  }
  return <Badge variant="success">{t("status.active")}</Badge>
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
  onDelete: (promotion: Promotion) => void,
  t: (key: string) => string
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
          {t("columns.code")}
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
      header: t("columns.type"),
      cell: ({ row }) => getTypeBadge(row.original.type, t),
    },
    {
      id: "discount",
      header: t("columns.discount"),
      cell: ({ row }) => (
        <span className="text-sm">{formatDiscount(row.original)}</span>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: ({ row }) => getStatusInfo(row.original, t),
    },
    {
      id: "automatic",
      header: t("columns.automatic"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.is_automatic ? t("detail.yes") : t("detail.no")}
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
          {t("columns.created")}
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
                <span className="sr-only">{t("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/promotions/${promotion.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              </Link>
              <Link href={`/promotions/${promotion.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(promotion)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]
}
