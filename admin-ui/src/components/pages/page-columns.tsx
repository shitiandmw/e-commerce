"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Page } from "@/hooks/use-pages"
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

export function getPageColumns(
  onDelete: (page: Page) => void,
  t: (key: string) => string
): ColumnDef<Page>[] {
  return [
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
            href={`/pages/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            /{row.original.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "published" ? "default" : "secondary"}
        >
          {t(`status.${row.original.status}`)}
        </Badge>
      ),
      size: 100,
    },
    {
      accessorKey: "template",
      header: t("columns.template"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.template ? t(`templates.${row.original.template}`) : "-"}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "sort_order",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.sortOrder")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sort_order}
        </span>
      ),
      size: 80,
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
        const page = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/pages/${page.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              </Link>
              <Link href={`/pages/${page.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(page)}
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
