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
  Calendar,
  Tag,
  Zap,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { format } from "date-fns"

function getStatusInfo(promotion: Promotion, t: (key: string) => string) {
  const now = new Date()
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    return <Badge variant="destructive">{t("status.expired")}</Badge>
  }
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    return <Badge variant="warning">{t("status.scheduled")}</Badge>
  }
  return <Badge variant="success">{t("status.active")}</Badge>
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

function formatDiscountValue(promotion: Promotion) {
  const method = promotion.application_method
  if (!method) return "-"
  if (method.type === "percentage") {
    return `${method.value}%`
  }
  const currency = method.currency_code?.toUpperCase() || "USD"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(method.value)
}

function formatTargetType(target: string, t: (key: string) => string) {
  switch (target) {
    case "order":
      return t("form.entireOrder")
    case "items":
      return t("form.specificItems")
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/promotions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">
                {promotion.code}
              </h1>
              {getStatusInfo(promotion, t)}
              {getTypeBadge(promotion.type, t)}
            </div>
            <p className="text-muted-foreground mt-1">
              {promotion.is_automatic ? t("application.automaticPromotion") : t("application.manualCode")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/promotions/${promotionId}/edit`}>
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
                <p className="text-sm capitalize">
                  {promotion.application_method?.type || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.discountValue")}
                </p>
                <p className="text-lg font-semibold">
                  {formatDiscountValue(promotion)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.appliesTo")}
                </p>
                <p className="text-sm">
                  {formatTargetType(
                    promotion.application_method?.target_type || "-",
                    t
                  )}
                </p>
              </div>
              {promotion.application_method?.allocation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("detail.allocation")}
                  </p>
                  <p className="text-sm capitalize">
                    {promotion.application_method.allocation}
                  </p>
                </div>
              )}
            </div>
          </div>

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
                  {promotion.starts_at
                    ? format(
                        new Date(promotion.starts_at),
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
                  {promotion.ends_at
                    ? format(
                        new Date(promotion.ends_at),
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
