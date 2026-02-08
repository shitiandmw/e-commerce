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
import { useTranslations } from "next-intl"
import { useOrders } from "@/hooks/use-orders"
import { getOrderColumns } from "./order-columns"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { ExportButton } from "@/components/import-export/export-button"
import { useOrderExport } from "@/hooks/use-import-export"

export function OrderTable() {
  const t = useTranslations("orders")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [paymentFilter, setPaymentFilter] = React.useState("all")
  const [fulfillmentFilter, setFulfillmentFilter] = React.useState("all")
  const { exportOrders } = useOrderExport()
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const ORDER_STATUSES = [
    { value: "all", label: t("filters.allStatus") },
    { value: "pending", label: t("status.pending") },
    { value: "completed", label: t("status.completed") },
    { value: "canceled", label: t("status.canceled") },
    { value: "archived", label: t("status.archived") },
    { value: "requires_action", label: t("status.requiresAction") },
  ]

  const PAYMENT_STATUSES = [
    { value: "all", label: t("filters.allPayments") },
    { value: "captured", label: t("paymentStatus.paid") },
    { value: "awaiting", label: t("paymentStatus.awaiting") },
    { value: "refunded", label: t("paymentStatus.refunded") },
    { value: "not_paid", label: t("paymentStatus.notPaid") },
  ]

  const FULFILLMENT_STATUSES = [
    { value: "all", label: t("filters.allFulfillment") },
    { value: "not_fulfilled", label: t("fulfillmentStatus.unfulfilled") },
    { value: "fulfilled", label: t("fulfillmentStatus.fulfilled") },
    { value: "shipped", label: t("fulfillmentStatus.shipped") },
    { value: "partially_fulfilled", label: t("fulfillmentStatus.partial") },
    { value: "canceled", label: t("fulfillmentStatus.canceled") },
  ]

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
  }, [statusFilter, paymentFilter, fulfillmentFilter])

  const orderField =
    sorting.length > 0
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : "-created_at"

  const statusArray =
    statusFilter && statusFilter !== "all" ? [statusFilter] : undefined

  const { data, isLoading, isError, error } = useOrders({
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    q: debouncedSearch || undefined,
    order: orderField,
    status: statusArray,
  })

  const columns = React.useMemo(() => getOrderColumns(t), [t])

  const orders = data?.orders ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pagination.pageSize)

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
  })

  const hasActiveFilters =
    debouncedSearch ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    fulfillmentFilter !== "all"

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          </div>
          <ExportButton onExport={exportOrders} label={t("table.export")} size="sm" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[150px]"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-[150px]"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="w-[160px]"
          >
            {FULFILLMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
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
                        header.getSize() !== 150
                          ? header.getSize()
                          : undefined,
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
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-destructive">
                    {t("table.failedToLoad", {
                      error: error instanceof Error ? error.message : t("table.unknownError"),
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-muted-foreground">
                    {hasActiveFilters
                      ? t("table.noMatchingOrders")
                      : t("table.noOrdersYet")}
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
                {t("table.pageOf", {
                  page: pagination.pageIndex + 1,
                  total: pageCount,
                })}
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
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
