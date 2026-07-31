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
import { getPromotionDisplayStatus } from "@/lib/promotion-status"
import {
  isEditableCoupon,
  minorToMajorAmount,
  percentageToDiscountRate,
} from "@/lib/promotion-config"

function getStatusInfo(promotion: Promotion, t: (key: string) => string) {
  const status = getPromotionDisplayStatus(promotion)
  switch (status) {
    case "expired":
      return <Badge variant="destructive">{t("status.expired")}</Badge>
    case "scheduled":
      return <Badge variant="warning">{t("status.scheduled")}</Badge>
    case "draft":
      return <Badge variant="secondary">{t("status.draft")}</Badge>
    case "inactive":
      return <Badge variant="outline">{t("status.inactive")}</Badge>
    default:
      return <Badge variant="success">{t("status.active")}</Badge>
  }
}

function formatDiscount(
  promotion: Promotion,
  t: (key: string, values?: Record<string, number | string>) => string
) {
  const method = promotion.application_method
  if (!method) return "-"
  if (method.type === "percentage") {
    return t("summary.rate", {
      value: percentageToDiscountRate(method.value),
    })
  }
  const currency = method.currency_code?.toUpperCase() || "USD"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(minorToMajorAmount(method.value, currency))
}

export function getPromotionColumns(
  onDelete: (promotion: Promotion) => void,
  t: (key: string, values?: Record<string, number | string>) => string
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
      cell: ({ row }) => {
        const promotion = row.original
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/promotions/${promotion.id}`}
              className="font-medium font-mono hover:underline"
            >
              {promotion.code}
            </Link>
            {!isEditableCoupon(promotion) && (
              <Badge variant="outline">{t("legacy.badge")}</Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "discount",
      header: t("columns.discount"),
      cell: ({ row }) => (
        <span className="text-sm">{formatDiscount(row.original, t)}</span>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: ({ row }) => getStatusInfo(row.original, t),
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
              {isEditableCoupon(promotion) && (
                <Link href={`/promotions/${promotion.id}/edit`}>
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                </Link>
              )}
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
