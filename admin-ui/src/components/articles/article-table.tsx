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
  useArticles,
  useArticleCategories,
  Article,
  useDeleteArticle,
  buildCategoryTreeList,
} from "@/hooks/use-articles"
import { getArticleColumns } from "./article-columns"
import { DeleteArticleDialog } from "./delete-article-dialog"
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"

interface ArticleTableProps {
  onManageCategories: () => void
}

export function ArticleTable({ onManageCategories }: ArticleTableProps) {
  const t = useTranslations("articles")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError, error } = useArticles({
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    q: debouncedSearch || undefined,
    status: statusFilter || undefined,
    category_id: categoryFilter || undefined,
  })

  const { data: categoriesData } = useArticleCategories()
  const categories = categoriesData?.article_categories ?? []
  const categoryTree = React.useMemo(() => buildCategoryTreeList(categories), [categories])

  const deleteArticle = useDeleteArticle()
  const [articleToDelete, setArticleToDelete] = React.useState<Article | null>(
    null
  )

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return
    try {
      await deleteArticle.mutateAsync(articleToDelete.id)
      setArticleToDelete(null)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const columns = React.useMemo(
    () => getArticleColumns((article) => setArticleToDelete(article), t),
    [t]
  )

  const articles = data?.articles ?? []
  const totalCount = data?.count ?? 0
  const pageCount = Math.ceil(totalCount / pagination.pageSize)

  const table = useReactTable({
    data: articles,
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
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder={t("filters.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
            className="w-40"
          >
            <option value="">{t("filters.allCategories")}</option>
            {categoryTree.map(({ category: cat, depth }) => (
              <option key={cat.id} value={cat.id}>
                {"—".repeat(depth)} {cat.name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
            className="w-36"
          >
            <option value="">{t("filters.allStatuses")}</option>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onManageCategories}>
            <FolderOpen className="mr-2 h-4 w-4" />
            {t("manageCategories")}
          </Button>
          <Link href="/articles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addArticle")}
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
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
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
                    {error instanceof Error
                      ? error.message
                      : t("table.unknownError")}
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
                    {t("table.noArticles")}
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

      {/* Delete Dialog */}
      <DeleteArticleDialog
        article={articleToDelete}
        open={!!articleToDelete}
        onOpenChange={(open) => {
          if (!open) setArticleToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteArticle.isPending}
      />
    </div>
  )
}
