"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  PaginationState,
} from "@tanstack/react-table"
import {
  useInventoryItems,
  InventoryItem,
  getStockStatus,
  LOW_STOCK_THRESHOLD,
} from "@/hooks/use-inventory"
import { getInventoryColumns } from "./inventory-columns"
import { InventoryAdjustDialog } from "./inventory-adjust-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Warehouse,
  AlertTriangle,
  PackageX,
  Package,
} from "lucide-react"

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

export function InventoryTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [stockFilter, setStockFilter] = React.useState<StockFilter>("all")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [itemToAdjust, setItemToAdjust] = React.useState<InventoryItem | null>(null)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPagination((p) => ({ ...p, pageIndex: 0 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filter changes
  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [stockFilter])

  const orderField =
    sorting.length > 0
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : undefined

  const { data, isLoading, isError, error } = useInventoryItems({
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    q: debouncedSearch || undefined,
    order: orderField,
  })

  const columns = React.useMemo(
    () => getInventoryColumns((item) => setItemToAdjust(item)),
    []
  )

  // Client-side stock status filtering (since API doesn't support it natively)
  const allItems = data?.inventory_items ?? []
  const filteredItems = React.useMemo(() => {
    if (stockFilter === "all") return allItems
    return allItems.filter((item) => getStockStatus(item) === stockFilter)
  }, [allItems, stockFilter])

  const totalCount = stockFilter === "all" ? (data?.count ?? 0) : filteredItems.length
  const pageCount = Math.ceil(
    (stockFilter === "all" ? (data?.count ?? 0) : filteredItems.length) /
      pagination.pageSize
  )

  // Stats summary
  const stats = React.useMemo(() => {
    const items = allItems
    const lowStock = items.filter((i) => getStockStatus(i) === "low_stock").length
    const outOfStock = items.filter((i) => getStockStatus(i) === "out_of_stock").length
    const inStock = items.filter((i) => getStockStatus(i) === "in_stock").length
    return { lowStock, outOfStock, inStock, total: items.length }
  }, [allItems])

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: stockFilter === "all",
    manualSorting: true,
    pageCount: stockFilter === "all" ? pageCount : undefined,
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button
          onClick={() => setStockFilter("all")}
          className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
            stockFilter === "all" ? "border-primary bg-primary/5" : "bg-card"
          }`}
        >
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Items</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {isLoading ? "—" : data?.count ?? 0}
          </p>
        </button>
        <button
          onClick={() => setStockFilter("in_stock")}
          className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
            stockFilter === "in_stock" ? "border-primary bg-primary/5" : "bg-card"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">In Stock</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-green-600">
            {isLoading ? "—" : stats.inStock}
          </p>
        </button>
        <button
          onClick={() => setStockFilter("low_stock")}
          className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
            stockFilter === "low_stock" ? "border-primary bg-primary/5" : "bg-card"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Low Stock</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-yellow-600">
            {isLoading ? "—" : stats.lowStock}
          </p>
        </button>
        <button
          onClick={() => setStockFilter("out_of_stock")}
          className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
            stockFilter === "out_of_stock" ? "border-primary bg-primary/5" : "bg-card"
          }`}
        >
          <div className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Out of Stock</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-destructive">
            {isLoading ? "—" : stats.outOfStock}
          </p>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </Select>
        </div>
        {stockFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStockFilter("all")}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-destructive">
                    Failed to load inventory:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {debouncedSearch || stockFilter !== "all"
                      ? "No inventory items match your search criteria."
                      : "No inventory items found."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!isLoading && totalCount > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min(
                pagination.pageIndex * pagination.pageSize + 1,
                totalCount
              )}{" "}
              to{" "}
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalCount
              )}{" "}
              of {totalCount} items
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.pageIndex + 1} of {pageCount || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Dialog */}
      <InventoryAdjustDialog
        item={itemToAdjust}
        open={!!itemToAdjust}
        onOpenChange={(open) => {
          if (!open) setItemToAdjust(null)
        }}
      />
    </div>
  )
}
