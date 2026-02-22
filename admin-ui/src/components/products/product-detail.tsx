"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Product,
  useProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/hooks/use-products"
import { DeleteProductDialog } from "./delete-product-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select } from "@/components/ui/select"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Calendar,
  Tag,
  Warehouse,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import {
  useInventoryItems,
  InventoryItem,
  getStockStatus,
  getTotalAvailable,
  getTotalStocked,
  LOW_STOCK_THRESHOLD,
} from "@/hooks/use-inventory"

/** brand field may be a single object or an array (due to isList link) */
function resolveBrand(brand: Product["brand"]): { id: string; name: string } | null {
  if (!brand) return null
  if (Array.isArray(brand)) return brand[0] ?? null
  return brand
}

function getStatusBadge(status: Product["status"], t: (key: string) => string) {
  switch (status) {
    case "published":
      return <Badge variant="success">{t("statusOptions.published")}</Badge>
    case "draft":
      return <Badge variant="secondary">{t("statusOptions.draft")}</Badge>
    case "proposed":
      return <Badge variant="warning">{t("statusOptions.proposed")}</Badge>
    case "rejected":
      return <Badge variant="destructive">{t("statusOptions.rejected")}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function VariantInventoryBadge({ inventoryItem }: { inventoryItem?: InventoryItem }) {
  const t = useTranslations("products")
  if (!inventoryItem) return null
  const status = getStockStatus(inventoryItem)
  const available = getTotalAvailable(inventoryItem)
  switch (status) {
    case "in_stock":
      return (
        <Badge variant="success" className="text-xs">
          {t("detail.available", { count: available })}
        </Badge>
      )
    case "low_stock":
      return (
        <Badge variant="warning" className="text-xs gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t("detail.available", { count: available })}
        </Badge>
      )
    case "out_of_stock":
      return (
        <Badge variant="destructive" className="text-xs">
          {t("detail.outOfStock")}
        </Badge>
      )
  }
}

function VariantsWithInventory({ product }: { product: Product }) {
  const t = useTranslations("products")
  // Fetch inventory items matching variant SKUs
  const variantSkus = product.variants
    ?.map((v) => v.sku)
    .filter((s): s is string => !!s) ?? []

  const { data: inventoryData } = useInventoryItems({
    limit: 100,
  })

  const inventoryItems = inventoryData?.inventory_items ?? []

  // Build a map of SKU -> inventory item for quick lookup
  const skuToInventory = React.useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventoryItems.forEach((item) => {
      if (item.sku) {
        map.set(item.sku, item)
      }
    })
    return map
  }, [inventoryItems])

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t("detail.variantsInventory")}
          {product.variants && (
            <Badge variant="secondary">{product.variants.length}</Badge>
          )}
        </h2>
        <Link href="/inventory">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Warehouse className="mr-1.5 h-4 w-4" />
            {t("detail.manageInventory")}
          </Button>
        </Link>
      </div>

      {!product.variants || product.variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.noVariants")}
        </p>
      ) : (
        <div className="space-y-3">
          {product.variants.map((variant) => {
            const inventoryItem = variant.sku
              ? skuToInventory.get(variant.sku)
              : undefined
            const totalStocked = inventoryItem ? getTotalStocked(inventoryItem) : undefined
            const totalAvailable = inventoryItem ? getTotalAvailable(inventoryItem) : undefined

            return (
              <div
                key={variant.id}
                className="rounded-md border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{variant.title}</p>
                      <VariantInventoryBadge inventoryItem={inventoryItem} />
                    </div>
                    {variant.sku && (
                      <p className="text-xs text-muted-foreground font-mono">
                        SKU: {variant.sku}
                      </p>
                    )}
                    {variant.options && variant.options.length > 0 && (
                      <div className="flex gap-1.5 mt-1">
                        {variant.options.map((opt, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {opt.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {variant.prices?.map((price, i) => (
                      <p key={i} className="font-semibold">
                        {formatCurrency(price.amount, price.currency_code)}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Inventory details for this variant */}
                {inventoryItem && inventoryItem.location_levels && inventoryItem.location_levels.length > 0 && (
                  <div className="border-t pt-3 mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Warehouse className="h-3 w-3" />
                      {t("detail.stockByLocation")}
                    </p>
                    <div className="grid gap-2">
                      {inventoryItem.location_levels.map((level) => {
                        const isLow = level.available_quantity > 0 && level.available_quantity <= LOW_STOCK_THRESHOLD
                        const isOut = level.available_quantity <= 0
                        return (
                          <div key={level.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                            <span className="text-muted-foreground">
                              {level.location_id.substring(0, 12)}...
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">
                                {t("detail.stocked")}: <span className="font-medium text-foreground">{level.stocked_quantity}</span>
                              </span>
                              <span className="text-muted-foreground">
                                {t("detail.availableLabel")}:{" "}
                                <span className={`font-medium ${isOut ? "text-destructive" : isLow ? "text-yellow-600" : "text-green-600"}`}>
                                  {level.available_quantity}
                                </span>
                              </span>
                              {level.incoming_quantity > 0 && (
                                <span className="text-muted-foreground">
                                  {t("detail.incoming")}: <span className="font-medium">+{level.incoming_quantity}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback to basic inventory_quantity if no inventory item found */}
                {!inventoryItem && variant.inventory_quantity !== undefined && (
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {t("detail.stock")}: {variant.inventory_quantity}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ProductDetailProps {
  productId: string
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const t = useTranslations("products")
  const router = useRouter()
  const { data, isLoading, isError, error } = useProduct(productId)
  const deleteProduct = useDeleteProduct()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const product = data?.product

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(productId)
      router.push("/products")
    } catch (err) {
      // Handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="space-y-6">
        <Link href="/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToProducts")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("productNotFound")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {product.title}
              </h1>
              {getStatusBadge(product.status, t)}
            </div>
            {product.subtitle && (
              <p className="text-muted-foreground mt-1">{product.subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/products/${productId}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              {t("actions.edit")}
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("detail.productDetails")}
            </h2>

            {product.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noDescription")}
              </p>
            )}

            {product.handle && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.handle")}
                </p>
                <code className="text-sm bg-muted px-2 py-0.5 rounded">
                  {product.handle}
                </code>
              </div>
            )}

            {(product.weight ||
              product.length ||
              product.width ||
              product.height) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("detail.dimensions")}
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {product.weight && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">{t("detail.weight")}</p>
                      <p className="font-medium">{product.weight}g</p>
                    </div>
                  )}
                  {product.length && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">{t("detail.length")}</p>
                      <p className="font-medium">{product.length}mm</p>
                    </div>
                  )}
                  {product.width && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">{t("detail.width")}</p>
                      <p className="font-medium">{product.width}mm</p>
                    </div>
                  )}
                  {product.height && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">{t("detail.height")}</p>
                      <p className="font-medium">{product.height}mm</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Media */}
          {(product.thumbnail || (product.images && product.images.length > 0)) && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold">{t("detail.media")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {product.thumbnail && (
                  <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={product.thumbnail}
                      alt={t("detail.thumbnail")}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {t("detail.thumbnail")}
                    </Badge>
                  </div>
                )}
                {product.images?.map((img, i) => (
                  <div
                    key={img.id || i}
                    className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                  >
                    <img
                      src={img.url}
                      alt={`Image ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants & Inventory */}
          <VariantsWithInventory product={product} />

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("detail.options")}
              </h2>
              <div className="space-y-3">
                {product.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <p className="text-sm font-medium">{option.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {option.values?.map((val, i) => (
                        <Badge key={i} variant="outline">
                          {val.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.status")}</span>
                {getStatusBadge(product.status, t)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.variants")}</span>
                <span className="text-sm font-medium">
                  {product.variants?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(product.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(product.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Brand */}
          {resolveBrand(product.brand) && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {t("detail.brand")}
              </h2>
              <Link
                href={`/brands/${resolveBrand(product.brand)!.id}`}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {resolveBrand(product.brand)!.name}
              </Link>
            </div>
          )}

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {t("detail.categories")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {product.categories.map((cat) => (
                  <Badge key={cat.id} variant="secondary">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Product ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.productId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {product.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={product}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteProduct.isPending}
      />
    </div>
  )
}
