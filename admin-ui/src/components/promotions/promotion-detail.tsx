"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Promotion,
  usePromotion,
  useDeletePromotion,
} from "@/hooks/use-promotions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Percent,
  Package,
  Calendar,
  Tag,
  Zap,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import { getPromotionDisplayStatus } from "@/lib/promotion-status"
import {
  getProductIdsFromTargetRules,
  isEditableCoupon,
  minorToMajorAmount,
  percentageToDiscountRate,
} from "@/lib/promotion-config"
import { SelectedPromotionProducts } from "./selected-promotion-products"

function getStatusInfo(promotion: Promotion, t: (key: string) => string) {
  const status = getPromotionDisplayStatus(promotion)
  switch (status) {
    case "expired":
      return <Badge variant="destructive">{t("status.expired")}</Badge>
    case "scheduled":
      return <Badge variant="warning">{t("status.scheduled")}</Badge>
    case "draft":
      return <Badge variant="secondary">{t("status.draft")}</Badge>
    case "inactive":
      return <Badge variant="outline">{t("status.inactive")}</Badge>
    default:
      return <Badge variant="success">{t("status.active")}</Badge>
  }
}

function getTypeBadge(type: Promotion["type"], t: (key: string) => string) {
  switch (type) {
    case "standard":
      return <Badge variant="secondary">{t("type.standard")}</Badge>
    case "buyget":
      return <Badge variant="warning">{t("type.buyget")}</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function formatDiscountValue(
  promotion: Promotion,
  t: (key: string, values?: Record<string, number | string>) => string
) {
  const method = promotion.application_method
  if (!method) return "-"
  if (method.type === "percentage") {
    return isEditableCoupon(promotion)
      ? t("summary.rate", { value: percentageToDiscountRate(method.value) })
      : `${method.value}%`
  }
  const currency = method.currency_code?.toUpperCase() || "USD"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(minorToMajorAmount(method.value, currency))
}

function formatDiscountType(
  type: string,
  t: (key: string) => string
) {
  if (type === "percentage") return t("form.percentage")
  if (type === "fixed") return t("form.fixedAmount")
  return "-"
}

function formatAllocation(
  promotion: Promotion,
  t: (key: string) => string
) {
  const method = promotion.application_method
  if (!method?.allocation) return "-"

  if (method.target_type === "shipping_methods") {
    return method.allocation === "each"
      ? t("detail.shippingEach")
      : t("detail.shippingTotal")
  }

  if (method.allocation === "each") {
    return method.type === "fixed"
      ? t("form.fixedPerItem")
      : t("form.limitedItemDiscount")
  }

  return method.type === "fixed"
    ? t("form.totalFixedDiscount")
    : t("form.allEligibleItems")
}

function formatTargetType(
  target: string,
  selectedProductCount: number,
  t: (key: string, values?: Record<string, number>) => string
) {
  switch (target) {
    case "order":
      return t("form.entireOrder")
    case "items":
      return selectedProductCount > 0
        ? t("summary.selectedProducts", { count: selectedProductCount })
        : t("summary.allProducts")
    case "shipping_methods":
      return t("form.shippingMethods")
    default:
      return target
  }
}

interface PromotionDetailProps {
  promotionId: string
}

export function PromotionDetail({ promotionId }: PromotionDetailProps) {
  const t = useTranslations("promotions")
  const router = useRouter()
  const { data, isLoading, isError, error } = usePromotion(promotionId)
  const deletePromotion = useDeletePromotion()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const promotion = data?.promotion
  const editableCoupon = promotion ? isEditableCoupon(promotion) : false
  const selectedProductIds = getProductIdsFromTargetRules(
    promotion?.application_method?.target_rules
  )

  const handleDelete = async () => {
    try {
      await deletePromotion.mutateAsync(promotionId)
      router.push("/promotions")
    } catch {
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
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !promotion) {
    return (
      <div className="space-y-6">
        <Link href="/promotions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToPromotions")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("promotionNotFound")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/promotions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="break-all font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                {promotion.code}
              </h1>
              {getStatusInfo(promotion, t)}
              {!editableCoupon && (
                <Badge variant="outline">{t("legacy.badge")}</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {promotion.is_automatic ? t("application.automaticPromotion") : t("application.manualCode")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editableCoupon && (
            <Link href={`/promotions/${promotionId}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                {t("actions.edit")}
              </Button>
            </Link>
          )}
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
          {/* Discount Details */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Percent className="h-5 w-5" />
              {t("detail.promotionDetails")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.promotionType")}
                </p>
                <p className="text-sm">
                  {formatDiscountType(
                    promotion.application_method?.type || "",
                    t
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.discountValue")}
                </p>
                <p className="text-lg font-semibold">
                  {formatDiscountValue(promotion, t)}
                </p>
              </div>
              {!editableCoupon && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("detail.appliesTo")}
                  </p>
                  <p className="text-sm">
                    {formatTargetType(
                      promotion.application_method?.target_type || "-",
                      selectedProductIds.length,
                      t
                    )}
                  </p>
                </div>
              )}
              {!editableCoupon && promotion.application_method?.allocation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("detail.allocation")}
                  </p>
                  <p className="text-sm">{formatAllocation(promotion, t)}</p>
                </div>
              )}
            </div>
          </div>

          {promotion.application_method?.target_type === "items" &&
            selectedProductIds.length > 0 && (
              <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t("detail.applicableProducts")}
                </h2>
                <SelectedPromotionProducts productIds={selectedProductIds} />
              </div>
            )}

          {/* Rules */}
          {promotion.rules && promotion.rules.length > 0 && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t("detail.rules")}
              </h2>
              <div className="space-y-3">
                {promotion.rules.map((rule, i) => (
                  <div
                    key={rule.id || i}
                    className="rounded-md border p-4 space-y-1"
                  >
                    <p className="text-sm font-medium">{rule.attribute}</p>
                    <p className="text-xs text-muted-foreground">
                      {rule.operator}: {rule.values.join(", ")}
                    </p>
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
                <span className="text-sm text-muted-foreground">{t("columns.status")}</span>
                {getStatusInfo(promotion, t)}
              </div>
              {!editableCoupon && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("columns.type")}</span>
                    {getTypeBadge(promotion.type, t)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("detail.automatic")}
                    </span>
                    <span className="text-sm font-medium">
                      {promotion.is_automatic ? t("detail.yes") : t("detail.no")}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(promotion.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(promotion.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("schedule.title")}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("schedule.startDate")}
                </p>
                <p className="text-sm">
                  {promotion.campaign?.starts_at
                    ? format(
                        new Date(promotion.campaign.starts_at),
                        "MMM d, yyyy HH:mm"
                      )
                    : t("detail.notSet")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("schedule.endDate")}
                </p>
                <p className="text-sm">
                  {promotion.campaign?.ends_at
                    ? format(
                        new Date(promotion.campaign.ends_at),
                        "MMM d, yyyy HH:mm"
                      )
                    : t("detail.notSet")}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign */}
          {promotion.campaign && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {t("detail.campaign")}
              </h2>
              <p className="text-sm font-medium">{promotion.campaign.name}</p>
            </div>
          )}

          {/* Promotion ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.promotionId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {promotion.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { code: promotion.code })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePromotion.isPending}
            >
              {deletePromotion.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
