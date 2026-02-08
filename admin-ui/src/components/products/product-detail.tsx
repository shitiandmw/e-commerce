"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

function getStatusBadge(status: Product["status"]) {
  switch (status) {
    case "published":
      return <Badge variant="success">Published</Badge>
    case "draft":
      return <Badge variant="secondary">Draft</Badge>
    case "proposed":
      return <Badge variant="warning">Proposed</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
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

interface ProductDetailProps {
  productId: string
}

export function ProductDetail({ productId }: ProductDetailProps) {
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
            Back to Products
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Product not found or failed to load."}
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
              {getStatusBadge(product.status)}
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
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
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
              Product Details
            </h2>

            {product.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description provided.
              </p>
            )}

            {product.handle && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Handle
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
                  Dimensions
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {product.weight && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-medium">{product.weight}g</p>
                    </div>
                  )}
                  {product.length && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Length</p>
                      <p className="font-medium">{product.length}mm</p>
                    </div>
                  )}
                  {product.width && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Width</p>
                      <p className="font-medium">{product.width}mm</p>
                    </div>
                  )}
                  {product.height && (
                    <div className="text-center rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Height</p>
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
              <h2 className="text-lg font-semibold">Media</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {product.thumbnail && (
                  <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={product.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      Thumbnail
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

          {/* Variants */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Variants
              {product.variants && (
                <Badge variant="secondary">{product.variants.length}</Badge>
              )}
            </h2>

            {!product.variants || product.variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No variants defined.
              </p>
            ) : (
              <div className="space-y-3">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{variant.title}</p>
                      {variant.sku && (
                        <p className="text-xs text-muted-foreground">
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
                      {variant.inventory_quantity !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Stock: {variant.inventory_quantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Options
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
            <h2 className="text-lg font-semibold">Quick Info</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(product.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Variants</span>
                <span className="text-sm font-medium">
                  {product.variants?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {format(new Date(product.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm">
                  {format(new Date(product.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Brand */}
          {product.brand && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Brand
              </h2>
              <Link
                href={`/brands/${product.brand.id}`}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {product.brand.name}
              </Link>
            </div>
          )}

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories
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
              Product ID
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
