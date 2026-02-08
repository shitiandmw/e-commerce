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
import { usePromotions, Promotion, useDeletePromotion } from "@/hooks/use-promotions"
import { getPromotionColumns } from "./promotion-columns"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Loader2,
} from "lucide-react"
import Link from "next/link"

export function PromotionTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
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
  }, [typeFilter])

  const typeArray =
    typeFilter && typeFilter !== "all" ? [typeFilter] : undefined

  const orderField =
    sorting.length > 0
      ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}`
      : "-created_at"

  const { data, isLoading, isError, error } = usePromotions({
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    q: debouncedSearch || undefined,
    type: typeArray,
    order: orderField,
  })

  const deletePromotion = useDeletePromotion()
  const [promotionToDelete, setPromotionToDelete] =
    React.useState<Promotion | null>(null)

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return
    try {
      await deletePromotion.mutateAsync(promotionToDelete.id)
      setPromotionToDelete(null)
    } catch {
      // Error handled by mutation
    }
  }

  const columns = React.useMemo(
    () => getPromotionColumns((promotion) => setPromotionToDelete(promotion)),
    []
  )

  const promotions = data?.promotions ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pagination.pageSize)

  const table = useReactTable({
    data: promotions,
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
              placeholder="Search promotions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-[150px]"
          >
            <option value="all">All Types</option>
            <option value="standard">Standard</option>
            <option value="buyget">Buy X Get Y</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/promotions/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Promotion
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
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
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
                    Failed to load promotions:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
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
                    {debouncedSearch || typeFilter !== "all"
                      ? "No promotions match your search criteria."
                      : "No promotions yet. Create your first promotion to get started."}
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
              of {totalCount} promotions
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
                Page {pagination.pageIndex + 1} of {pageCount}
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

      {/* Delete Dialog */}
      <Dialog
        open={!!promotionToDelete}
        onOpenChange={(open) => {
          if (!open) setPromotionToDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the promotion{" "}
              <strong>{promotionToDelete?.code}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPromotionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletePromotion.isPending}
            >
              {deletePromotion.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
