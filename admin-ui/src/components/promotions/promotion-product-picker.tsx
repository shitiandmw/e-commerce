"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Package, Search } from "lucide-react"
import { Product, useProducts } from "@/hooks/use-products"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface PromotionProductPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProductIds: string[]
  onConfirm: (productIds: string[]) => void
}

function ProductThumbnail({ product }: { product: Product }) {
  if (product.thumbnail) {
    return (
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        <img
          src={product.thumbnail}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
      <Package className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

export function PromotionProductPicker({
  open,
  onOpenChange,
  selectedProductIds,
  onConfirm,
}: PromotionProductPickerProps) {
  const t = useTranslations("promotions")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [draftIds, setDraftIds] = React.useState<string[]>(selectedProductIds)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    if (!open) return
    setSearch("")
    setDebouncedSearch("")
    setDraftIds(selectedProductIds)
  }, [open, selectedProductIds])

  const { data, isLoading, isError } = useProducts({
    q: debouncedSearch || undefined,
    status: ["published"],
    limit: 50,
    fields: "id,title,status,thumbnail,variants.id",
    enabled: open,
  })
  const products = data?.products || []
  const draftIdSet = React.useMemo(() => new Set(draftIds), [draftIds])

  const toggleProduct = (productId: string) => {
    setDraftIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    )
  }

  const handleConfirm = () => {
    onConfirm(draftIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="mx-3 flex max-h-[85vh] w-[calc(100%_-_1.5rem)] max-w-3xl flex-col p-4 sm:p-6"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>{t("productPicker.title")}</DialogTitle>
          <DialogDescription>{t("productPicker.description")}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("productPicker.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto border-y">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>{t("productPicker.product")}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("productPicker.variants")}
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("productPicker.status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-destructive">
                    {t("productPicker.loadError")}
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t("productPicker.noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const checked = draftIdSet.has(product.id)
                  return (
                    <TableRow
                      key={product.id}
                      data-state={checked ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => toggleProduct(product.id)}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(product.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={t("productPicker.selectProduct", {
                            title: product.title,
                          })}
                          className="h-4 w-4 rounded border-input"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumbnail product={product} />
                          <div className="min-w-0">
                            <span className="break-words font-medium">
                              {product.title}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                              <span className="text-xs text-muted-foreground">
                                {t("productPicker.variantCount", {
                                  count: product.variants?.length || 0,
                                })}
                              </span>
                              <Badge variant="success">
                                {t("productPicker.published")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {t("productPicker.variantCount", {
                          count: product.variants?.length || 0,
                        })}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="success">
                          {t("productPicker.published")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {t("productPicker.selectedCount", { count: draftIds.length })}
          </span>
          <div className="flex gap-2">
            <Button className="flex-1 sm:flex-none" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button className="flex-1 sm:flex-none" type="button" onClick={handleConfirm}>
              {t("productPicker.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
