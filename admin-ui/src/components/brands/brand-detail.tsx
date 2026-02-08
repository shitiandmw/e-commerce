"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Brand, useBrand, useDeleteBrand } from "@/hooks/use-brands"
import { DeleteBrandDialog } from "./delete-brand-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  Package,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface BrandDetailProps {
  brandId: string
}

export function BrandDetail({ brandId }: BrandDetailProps) {
  const t = useTranslations("brands")
  const router = useRouter()
  const { data, isLoading, isError, error } = useBrand(brandId)
  const deleteBrand = useDeleteBrand()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const brand = data?.brand

  const handleDelete = async () => {
    try {
      await deleteBrand.mutateAsync(brandId)
      router.push("/brands")
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
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !brand) {
    return (
      <div className="space-y-6">
        <Link href="/brands">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToBrands")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("brandNotFound")}
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
          <Link href="/brands">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {brand.logo_url ? (
              <div className="h-12 w-12 rounded-lg border overflow-hidden bg-muted">
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center">
                <span className="text-lg font-bold text-muted-foreground">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {brand.name}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/brands/${brandId}/edit`}>
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
          {/* Brand Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t("detail.brandDetails")}
            </h2>

            {brand.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {brand.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noDescription")}
              </p>
            )}
          </div>

          {/* Associated Products */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("detail.products")}
              {brand.products && (
                <Badge variant="secondary">{brand.products.length}</Badge>
              )}
            </h2>

            {!brand.products || brand.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("detail.noProducts")}
              </p>
            ) : (
              <div className="space-y-3">
                {brand.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium hover:underline text-sm"
                        >
                          {product.title}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">
                          {product.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.productCount")}</span>
                <span className="text-sm font-medium">
                  {brand.products?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(brand.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(brand.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Brand ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.brandId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {brand.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteBrandDialog
        brand={brand}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteBrand.isPending}
      />
    </div>
  )
}
