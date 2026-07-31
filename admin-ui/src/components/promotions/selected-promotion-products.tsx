"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, Package, Trash2 } from "lucide-react"
import { useProducts } from "@/hooks/use-products"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SelectedPromotionProductsProps {
  productIds: string[]
  onRemove?: (productId: string) => void
}

export function SelectedPromotionProducts({
  productIds,
  onRemove,
}: SelectedPromotionProductsProps) {
  const t = useTranslations("promotions")
  const { data, isLoading } = useProducts({
    id: productIds,
    limit: Math.max(productIds.length, 1),
    fields: "id,title,status,thumbnail,variants.id",
    enabled: productIds.length > 0,
  })
  const productMap = new Map(
    (data?.products || []).map((product) => [product.id, product])
  )

  if (productIds.length === 0) {
    return (
      <div className="border-y py-8 text-center text-sm text-muted-foreground">
        {t("selectedProducts.empty")}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border-y">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("productPicker.product")}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("productPicker.variants")}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("productPicker.status")}
            </TableHead>
            {onRemove && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? productIds.map((productId) => (
                <TableRow key={productId}>
                  <TableCell><Skeleton className="h-10 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  {onRemove && <TableCell><Skeleton className="h-8 w-16" /></TableCell>}
                </TableRow>
              ))
            : productIds.map((productId) => {
                const product = productMap.get(productId)
                if (!product) {
                  return (
                    <TableRow key={productId}>
                      <TableCell colSpan={onRemove ? 3 : 2}>
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{t("selectedProducts.unavailable")}</span>
                          <code className="text-xs">{productId}</code>
                        </div>
                      </TableCell>
                      {onRemove && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(productId)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("selectedProducts.remove")}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.thumbnail ? (
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            <img
                              src={product.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="break-words font-medium">
                            {product.title}
                          </span>
                          <div className="mt-1 space-y-1 sm:hidden">
                            <p className="text-xs text-muted-foreground">
                              {t("selectedProducts.allVariants", {
                                count: product.variants?.length || 0,
                              })}
                            </p>
                            <Badge variant={product.status === "published" ? "success" : "warning"}>
                              {product.status === "published"
                                ? t("productPicker.published")
                                : t("selectedProducts.notPublished")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {t("selectedProducts.allVariants", {
                        count: product.variants?.length || 0,
                      })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={product.status === "published" ? "success" : "warning"}>
                        {product.status === "published"
                          ? t("productPicker.published")
                          : t("selectedProducts.notPublished")}
                      </Badge>
                    </TableCell>
                    {onRemove && (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(product.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("selectedProducts.remove")}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
        </TableBody>
      </Table>
    </div>
  )
}
