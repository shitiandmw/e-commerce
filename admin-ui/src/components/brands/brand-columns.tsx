"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Brand } from "@/hooks/use-brands"
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

export function getBrandColumns(
  onDelete: (brand: Brand) => void
): ColumnDef<Brand>[] {
  return [
    {
      accessorKey: "logo_url",
      header: "",
      cell: ({ row }) => {
        const logoUrl = row.original.logo_url
        return (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 60,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <Link
            href={`/brands/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
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
      id: "products",
      header: "Products",
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
          Created
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
        const brand = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/brands/${brand.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              </Link>
              <Link href={`/brands/${brand.id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={() => onDelete(brand)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]
}
