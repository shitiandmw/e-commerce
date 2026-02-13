"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useProducts } from "@/hooks/use-products"
import { useAddCollectionItem, CollectionItem } from "@/hooks/use-curated-collections"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Check, Loader2 } from "lucide-react"

interface ProductPickerDialogProps {
  collectionId: string
  tabId?: string
  existingProductIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductPickerDialog({
  collectionId,
  tabId,
  existingProductIds,
  open,
  onOpenChange,
}: ProductPickerDialogProps) {
  const t = useTranslations("collections")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [addingId, setAddingId] = React.useState<string | null>(null)

  const addItem = useAddCollectionItem(collectionId)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProducts({
    q: debouncedSearch || undefined,
    limit: 20,
    offset: 0,
  })

  const products = data?.products ?? []

  const handleAdd = async (productId: string) => {
    setAddingId(productId)
    try {
      await addItem.mutateAsync({
        product_id: productId,
        tab_id: tabId,
        sort_order: 0,
      })
    } catch (err) {
      // handled by mutation
    } finally {
      setAddingId(null)
    }
  }

  // Reset search when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearch("")
      setDebouncedSearch("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{t("productPicker.title")}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("productPicker.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[50vh]">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md border">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ))
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("productPicker.noResults")}
            </div>
          ) : (
            products.map((product) => {
              const isAlreadyAdded = existingProductIds.includes(product.id)
              const isAdding = addingId === product.id
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-md border"
                >
                  {/* Thumbnail */}
                  {product.thumbnail ? (
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        N/A
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize"
                    >
                      {product.status}
                    </Badge>
                  </div>

                  {/* Action */}
                  {isAlreadyAdded ? (
                    <Button variant="ghost" size="sm" disabled>
                      <Check className="mr-1 h-3 w-3" />
                      {t("productPicker.alreadyAdded")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(product.id)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      {isAdding
                        ? t("productPicker.adding")
                        : t("productPicker.add")}
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("productPicker.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
