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

function getStockBadge(item: InventoryItem) {
  const status = getStockStatus(item)
  switch (status) {
    case "in_stock":
      return <Badge variant="success">In Stock</Badge>
    case "low_stock":
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    case "out_of_stock":
      return <Badge variant="destructive">Out of Stock</Badge>
  }
}

export function getInventoryColumns(
  onAdjust: (item: InventoryItem) => void
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
          SKU
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
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-sm truncate">
            {row.original.title || "Untitled"}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => getStockBadge(row.original),
    },
    {
      id: "stocked",
      header: "Stocked",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {getTotalStocked(row.original)}
        </span>
      ),
    },
    {
      id: "reserved",
      header: "Reserved",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {getTotalReserved(row.original)}
        </span>
      ),
    },
    {
      id: "available",
      header: "Available",
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
      header: "Incoming",
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
      header: "Locations",
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
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/inventory/${item.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAdjust(item)}>
                <PenLine className="mr-2 h-4 w-4" />
                Adjust Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]
}
