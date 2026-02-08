"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from "@tanstack/react-table"
import { useProducts, Product, useDeleteProduct } from "@/hooks/use-products"
import { getProductColumns } from "./product-columns"
import { DeleteProductDialog } from "./delete-product-dialog"
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
  Plus,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { ExportButton } from "@/components/import-export/export-button"
import { ImportDialog } from "@/components/import-export/import-dialog"
import {
  useProductImportExport,
  PRODUCT_CSV_HEADERS,
} from "@/hooks/use-import-export"

export function ProductTable() {
  const t = useTranslations("products")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

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
  }, [statusFilter])

  const statusArray =
    statusFilter && statusFilter !== "all" ? [statusFilter] : undefined

  const orderField =
    sorting.length > 0
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : "-created_at"

  const { data, isLoading, isError, error } = useProducts({
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    q: debouncedSearch || undefined,
    status: statusArray,
    order: orderField,
  })

  const deleteProduct = useDeleteProduct()
  const [productToDelete, setProductToDelete] =
    React.useState<Product | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)
  const { exportProducts, importProducts } = useProductImportExport()

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct.mutateAsync(productToDelete.id)
      setProductToDelete(null)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const columns = React.useMemo(
    () => getProductColumns((product) => setProductToDelete(product), t),
    [t]
  )

  const products = data?.products ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pagination.pageSize)

  const table = useReactTable({
    data: products,
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[150px]"
          >
            <option value="all">{t("statusOptions.all")}</option>
            <option value="published">{t("statusOptions.published")}</option>
            <option value="draft">{t("statusOptions.draft")}</option>
            <option value="proposed">{t("statusOptions.proposed")}</option>
            <option value="rejected">{t("statusOptions.rejected")}</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExport={exportProducts} label={t("actions.export")} size="sm" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("actions.import")}
          </Button>
          <Link href="/products/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("addProduct")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
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
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
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
                    {t("table.errorLoading")}:{" "}
                    {error instanceof Error ? error.message : t("table.unknownError")}
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
                    {debouncedSearch || statusFilter !== "all"
                      ? t("table.noMatchingProducts")
                      : t("table.noProducts")}
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
              {t("table.showing", {
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
                {t("table.page", {
                  current: pagination.pageIndex + 1,
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

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title={t("importDialog.title")}
        description={t("importDialog.description")}
        templateHeaders={PRODUCT_CSV_HEADERS}
        templateFilename="products-import-template.csv"
        onImport={importProducts}
      />

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={productToDelete}
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteProduct.isPending}
      />
    </div>
  )
}
