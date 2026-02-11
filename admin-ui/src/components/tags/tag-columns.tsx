"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Tag } from "@/hooks/use-tags"
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

export function getTagColumns(
  onDelete: (tag: Tag) => void,
  t: (key: string) => string
): ColumnDef<Tag>[] {
  return [
    {
      accessorKey: "color",
      header: "",
      cell: ({ row }) => {
        const color = row.original.color
        return (
          <div
            className="w-8 h-8 rounded-full border-2 border-muted flex-shrink-0"
            style={{ backgroundColor: color || "#e5e7eb" }}
          />
        )
      },
      enableSorting: false,
      size: 50,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t("columns.name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/tags/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: t("columns.type"),
      cell: ({ row }) => (
        <Badge variant={row.original.type === "badge" ? "default" : "secondary"}>
          {t(`typeOptions.${row.original.type}`)}
        </Badge>
      ),
    },
    {
      id: "products",
      header: t("columns.products"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.products?.length || 0}
        </Badge>
      ),
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
        const tag = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/tags/${tag.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              </Link>
              <Link href={`/tags/${tag.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(tag)}
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
