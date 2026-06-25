"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
  useInventoryItemsSummary,
  useInventoryProductLinks,
  useStockLocations,
  useBulkEnableInventory,
  InventoryItem,
  getStockStatus,
  buildInventoryProductLinkMap,
  inventoryItemMatchesSearch,
  withInventoryProductLinks,
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
  Loader2,
  Settings2,
} from "lucide-react"

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"

export function InventoryTable() {
  const t = useTranslations("inventory")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [stockFilter, setStockFilter] = React.useState<StockFilter>("all")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [itemToAdjust, setItemToAdjust] = React.useState<InventoryItem | null>(null)
  const { data: locationsData } = useStockLocations()
  const {
    data: productLinksData,
    isLoading: isProductLinksLoading,
  } = useInventoryProductLinks()
  const bulkEnable = useBulkEnableInventory()
  const [bulkProgress, setBulkProgress] = React.useState<string | null>(null)

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
    order: orderField,
  })
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
  } = useInventoryItemsSummary({
    order: orderField,
  })

  const columns = React.useMemo(
    () => getInventoryColumns((item) => setItemToAdjust(item), t),
    [t]
  )

  // Client-side stock status filtering (since API doesn't support it natively).
  // The summary query loads every item so filters and product-linked search are
  // not limited to the current server-paginated page.
  const linksByInventoryItemId = React.useMemo(
    () => buildInventoryProductLinkMap(productLinksData || []),
    [productLinksData]
  )
  const allItems = React.useMemo(
    () =>
      withInventoryProductLinks(
        data?.inventory_items ?? [],
        linksByInventoryItemId
      ),
    [data?.inventory_items, linksByInventoryItemId]
  )
  const summaryItems = React.useMemo(
    () =>
      withInventoryProductLinks(
        summaryData?.inventory_items ?? [],
        linksByInventoryItemId
      ),
    [summaryData?.inventory_items, linksByInventoryItemId]
  )
  const searchFilteredSummaryItems = React.useMemo(() => {
    if (!debouncedSearch) return summaryItems
    return summaryItems.filter((item) =>
      inventoryItemMatchesSearch(item, debouncedSearch)
    )
  }, [summaryItems, debouncedSearch])
  const statusFilteredItems = React.useMemo(() => {
    if (stockFilter === "all") return searchFilteredSummaryItems
    return searchFilteredSummaryItems.filter(
      (item) => getStockStatus(item) === stockFilter
    )
  }, [searchFilteredSummaryItems, stockFilter])
  const searchStats = React.useMemo(() => {
    return searchFilteredSummaryItems.reduce(
      (stats, item) => {
        const status = getStockStatus(item)
        stats.total += 1
        if (status === "in_stock") stats.inStock += 1
        if (status === "low_stock") stats.lowStock += 1
        if (status === "out_of_stock") stats.outOfStock += 1
        return stats
      },
      { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
    )
  }, [searchFilteredSummaryItems])
  const filteredItems = React.useMemo(() => {
    if (stockFilter === "all" && !debouncedSearch) return allItems

    const start = pagination.pageIndex * pagination.pageSize
    return statusFilteredItems.slice(start, start + pagination.pageSize)
  }, [
    allItems,
    debouncedSearch,
    pagination.pageIndex,
    pagination.pageSize,
    statusFilteredItems,
    stockFilter,
  ])

  const stats = debouncedSearch ? searchStats : summaryData?.stats
  const totalCount =
    stockFilter === "all" && !debouncedSearch
      ? data?.count ?? 0
      : statusFilteredItems.length
  const pageCount = Math.ceil(totalCount / pagination.pageSize)
  const usesSummaryTable = stockFilter !== "all" || !!debouncedSearch
  const tableIsLoading = usesSummaryTable
    ? isSummaryLoading || (!!debouncedSearch && isProductLinksLoading)
    : isLoading
  const tableIsError = usesSummaryTable ? isSummaryError : isError
  const tableError = usesSummaryTable ? summaryError : error
  const statsAreLoading =
    isSummaryLoading || (!!debouncedSearch && isProductLinksLoading)

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
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
            <span className="text-sm text-muted-foreground">{t("stats.totalItems")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {debouncedSearch
              ? isSummaryLoading || isProductLinksLoading
                ? "—"
                : searchStats.total
              : isLoading
              ? "—"
              : data?.count ?? 0}
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
            <span className="text-sm text-muted-foreground">{t("stats.inStock")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-green-600">
            {statsAreLoading || isSummaryError ? "—" : stats?.inStock ?? 0}
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
            <span className="text-sm text-muted-foreground">{t("stats.lowStock")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-yellow-600">
            {statsAreLoading || isSummaryError ? "—" : stats?.lowStock ?? 0}
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
            <span className="text-sm text-muted-foreground">{t("stats.outOfStock")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-destructive">
            {statsAreLoading || isSummaryError ? "—" : stats?.outOfStock ?? 0}
          </p>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
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
            <option value="all">{t("filters.allStatus")}</option>
            <option value="in_stock">{t("filters.inStock")}</option>
            <option value="low_stock">{t("filters.lowStock")}</option>
            <option value="out_of_stock">{t("filters.outOfStock")}</option>
          </Select>
        </div>
        {stockFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStockFilter("all")}
          >
            {t("filters.clearFilter")}
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
            {tableIsLoading ? (
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
            ) : tableIsError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-destructive">
                    {t("table.failedToLoad", { error: tableError instanceof Error ? tableError.message : t("table.unknownError") })}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  {!debouncedSearch && stockFilter === "all" ? (
                    <div className="py-12 space-y-4">
                      <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/40" />
                      <div>
                        <p className="text-base font-medium">{t("emptyState.title")}</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                          {t("emptyState.description")}
                        </p>
                      </div>
                      {locationsData?.stock_locations?.[0] && (
                        <Button
                          variant="default"
                          onClick={async () => {
                            const loc = locationsData.stock_locations[0]
                            setBulkProgress(t("emptyState.enabling"))
                            try {
                              const result = await bulkEnable.mutateAsync(loc.id)
                              setBulkProgress(
                                t("emptyState.enabledCount", { count: result.enabled })
                              )
                            } catch {
                              setBulkProgress(t("emptyState.enableFailed"))
                            }
                          }}
                          disabled={bulkEnable.isPending}
                        >
                          {bulkEnable.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {bulkProgress || t("emptyState.enabling")}
                            </>
                          ) : (
                            <>
                              <Settings2 className="mr-2 h-4 w-4" />
                              {t("emptyState.enableAll")}
                            </>
                          )}
                        </Button>
                      )}
                      {bulkProgress && !bulkEnable.isPending && (
                        <p className="text-sm text-muted-foreground">{bulkProgress}</p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-muted-foreground">
                      {t("table.noMatchingItems")}
                    </div>
                  )}
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
        {!tableIsLoading && totalCount > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t("table.showingPagination", {
                from: Math.min(
                  pagination.pageIndex * pagination.pageSize + 1,
                  totalCount
                ),
                to: Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  totalCount
                ),
                total: totalCount,
              })}
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
                {t("table.pageOf", { page: pagination.pageIndex + 1, total: pageCount || 1 })}
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
