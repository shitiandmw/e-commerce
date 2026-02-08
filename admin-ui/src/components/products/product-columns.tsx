"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/hooks/use-products"
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

function getStatusBadge(status: Product["status"], t: (key: string) => string) {
  switch (status) {
    case "published":
      return <Badge variant="success">{t("statusOptions.published")}</Badge>
    case "draft":
      return <Badge variant="secondary">{t("statusOptions.draft")}</Badge>
    case "proposed":
      return <Badge variant="warning">{t("statusOptions.proposed")}</Badge>
    case "rejected":
      return <Badge variant="destructive">{t("statusOptions.rejected")}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatPrice(variants: Product["variants"]) {
  if (!variants || variants.length === 0) return "-"
  const firstVariant = variants[0]
  if (!firstVariant.prices || firstVariant.prices.length === 0) return "-"
  const price = firstVariant.prices[0]
  const amount = price.amount / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency_code.toUpperCase(),
  }).format(amount)
}

export function getProductColumns(
  onDelete: (product: Product) => void,
  t: (key: string) => string
): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "thumbnail",
      header: "",
      cell: ({ row }) => {
        const thumbnail = row.original.thumbnail
        return (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={row.original.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">N/A</span>
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 60,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.title")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <Link
            href={`/products/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
          {row.original.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {row.original.subtitle}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => getStatusBadge(row.original.status, t),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "price",
      header: t("columns.price"),
      cell: ({ row }) => (
        <span className="text-sm">{formatPrice(row.original.variants)}</span>
      ),
    },
    {
      id: "variants",
      header: t("columns.variants"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.variants?.length || 0}
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
        const product = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/products/${product.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              </Link>
              <Link href={`/products/${product.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(product)}
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
