"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Popup } from "@/hooks/use-popups"
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

export function getPopupColumns(
  onDelete: (popup: Popup) => void,
  t: (key: string) => string
): ColumnDef<Popup>[] {
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
            href={`/popups/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title || t("columns.untitled")}
          </Link>
          {row.original.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "is_enabled",
      header: t("columns.status"),
      cell: ({ row }) => (
        <Badge variant={row.original.is_enabled ? "default" : "secondary"}>
          {row.original.is_enabled ? t("columns.enabled") : t("columns.disabled")}
        </Badge>
      ),
      size: 100,
    },
    {
      accessorKey: "trigger_type",
      header: t("columns.triggerType"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {t(`triggerType.${row.original.trigger_type}`)}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: "display_frequency",
      header: t("columns.frequency"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {t(`displayFrequency.${row.original.display_frequency}`)}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: "sort_order",
      header: t("columns.sortOrder"),
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
        const popup = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/popups/${popup.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
              </Link>
              <Link href={`/popups/${popup.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(popup)}
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
