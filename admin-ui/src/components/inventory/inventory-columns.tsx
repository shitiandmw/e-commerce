"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  InventoryItem,
  getStockStatus,
  getTotalStocked,
  getTotalReserved,
  getTotalAvailable,
  getTotalIncoming,
} from "@/hooks/use-inventory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  PenLine,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

function getStockBadge(item: InventoryItem, t: (key: string) => string) {
  const status = getStockStatus(item)
  switch (status) {
    case "in_stock":
      return <Badge variant="success">{t("status.inStock")}</Badge>
    case "low_stock":
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t("status.lowStock")}
        </Badge>
      )
    case "out_of_stock":
      return <Badge variant="destructive">{t("status.outOfStock")}</Badge>
  }
}

export function getInventoryColumns(
  onAdjust: (item: InventoryItem) => void,
  t: (key: string) => string
): ColumnDef<InventoryItem>[] {
  return [
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.sku")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/inventory/${row.original.id}`}
          className="font-medium font-mono text-sm hover:underline"
        >
          {row.original.sku || "—"}
        </Link>
      ),
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
        <div className="max-w-[200px]">
          <p className="text-sm truncate">
            {row.original.title || t("table.untitled")}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: ({ row }) => getStockBadge(row.original, t),
    },
    {
      id: "stocked",
      header: t("columns.stocked"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {getTotalStocked(row.original)}
        </span>
      ),
    },
    {
      id: "reserved",
      header: t("columns.reserved"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {getTotalReserved(row.original)}
        </span>
      ),
    },
    {
      id: "available",
      header: t("columns.available"),
      cell: ({ row }) => {
        const available = getTotalAvailable(row.original)
        return (
          <span
            className={`text-sm font-medium tabular-nums ${
              available <= 0
                ? "text-destructive"
                : available <= 10
                ? "text-yellow-600"
                : ""
            }`}
          >
            {available}
          </span>
        )
      },
    },
    {
      id: "incoming",
      header: t("columns.incoming"),
      cell: ({ row }) => {
        const incoming = getTotalIncoming(row.original)
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {incoming > 0 ? `+${incoming}` : "—"}
          </span>
        )
      },
    },
    {
      id: "locations",
      header: t("columns.locations"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.location_levels?.length || 0}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("table.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/inventory/${item.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("table.viewDetails")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAdjust(item)}>
                <PenLine className="mr-2 h-4 w-4" />
                {t("table.adjustStock")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]
}
