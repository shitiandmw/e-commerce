"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Article } from "@/hooks/use-articles"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, MoreHorizontal, Eye, Pencil, Trash2, Pin } from "lucide-react"
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

export function getArticleColumns(
  onDelete: (article: Article) => void,
  t: (key: string) => string
): ColumnDef<Article>[] {
  return [
    {
      accessorKey: "cover_image",
      header: "",
      cell: ({ row }) => {
        const coverImage = row.original.cover_image
        return (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {coverImage ? (
              <img
                src={coverImage}
                alt={row.original.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">
                {row.original.title.charAt(0).toUpperCase()}
              </span>
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
            href={`/articles/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
          {row.original.summary && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {row.original.summary}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: t("columns.category"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.category?.name || t("table.noCategory")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {t(`status.${status}`)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "is_pinned",
      header: t("columns.pinned"),
      cell: ({ row }) =>
        row.original.is_pinned ? (
          <Pin className="h-4 w-4 text-primary" />
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
      size: 70,
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
        const article = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/articles/${article.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              </Link>
              <Link href={`/articles/${article.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(article)}
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
