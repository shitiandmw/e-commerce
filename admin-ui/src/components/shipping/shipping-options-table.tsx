"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  useShippingOptions,
  useDeleteShippingOption,
  type ShippingOption,
} from "@/hooks/use-shipping"
import { ShippingOptionForm } from "./shipping-option-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 20

export function ShippingOptionsTable() {
  const t = useTranslations("shipping")
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editOption, setEditOption] = useState<ShippingOption | null>(null)

  const { data, isLoading } = useShippingOptions({
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  })
  const deleteOption = useDeleteShippingOption()

  const options = data?.shipping_options || []
  const count = data?.count || 0
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const handleEdit = (option: ShippingOption) => {
    setEditOption(option)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm(t("options.deleteConfirm"))) return
    deleteOption.mutate(id)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditOption(null)
  }

  const formatPrice = (option: ShippingOption) => {
    if (!option.prices || option.prices.length === 0) {
      return option.price_type === "calculated" ? t("options.priceType.calculated") : "—"
    }
    return option.prices
      .map(
        (p) =>
          `${p.currency_code.toUpperCase()} ${(p.amount / 100).toFixed(2)}`
      )
      .join(", ")
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-md border">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t("options.title")}{" "}
          <span className="text-muted-foreground font-normal">({count})</span>
        </h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("options.addOption")}
        </Button>
      </div>

      {options.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("options.noOptions")}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("options.columns.name")}</TableHead>
                  <TableHead>{t("options.columns.priceType")}</TableHead>
                  <TableHead>{t("options.columns.price")}</TableHead>
                  <TableHead>{t("options.columns.provider")}</TableHead>
                  <TableHead>{t("options.columns.profile")}</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">
                      {option.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{option.price_type}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(option)}</TableCell>
                    <TableCell>
                      {option.provider_id ? (
                        <Badge variant="secondary">{option.provider_id}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {option.shipping_profile_id ? (
                        <span className="text-sm text-muted-foreground">
                          {option.shipping_profile_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(option)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(option.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("table.showing", { from: page * PAGE_SIZE + 1, to: Math.min((page + 1) * PAGE_SIZE, count), total: count })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {t("table.page", { current: page + 1, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ShippingOptionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        editOption={editOption}
      />
    </div>
  )
}
