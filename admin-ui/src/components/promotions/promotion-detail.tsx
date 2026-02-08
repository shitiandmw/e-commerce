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
import { format } from "date-fns"

function getStatusInfo(promotion: Promotion) {
  const now = new Date()
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    return <Badge variant="destructive">Expired</Badge>
  }
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    return <Badge variant="warning">Scheduled</Badge>
  }
  return <Badge variant="success">Active</Badge>
}

function getTypeBadge(type: Promotion["type"]) {
  switch (type) {
    case "standard":
      return <Badge variant="secondary">Standard</Badge>
    case "buyget":
      return <Badge variant="warning">Buy X Get Y</Badge>
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

function formatTargetType(target: string) {
  switch (target) {
    case "order":
      return "Entire Order"
    case "items":
      return "Specific Items"
    case "shipping_methods":
      return "Shipping Methods"
    default:
      return target
  }
}

interface PromotionDetailProps {
  promotionId: string
}

export function PromotionDetail({ promotionId }: PromotionDetailProps) {
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
            Back to Promotions
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Promotion not found or failed to load."}
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
              {getStatusInfo(promotion)}
              {getTypeBadge(promotion.type)}
            </div>
            <p className="text-muted-foreground mt-1">
              {promotion.is_automatic ? "Automatic promotion" : "Manual code"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/promotions/${promotionId}/edit`}>
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
          {/* Discount Details */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Discount Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Discount Type
                </p>
                <p className="text-sm capitalize">
                  {promotion.application_method?.type || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Discount Value
                </p>
                <p className="text-lg font-semibold">
                  {formatDiscountValue(promotion)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Applies To
                </p>
                <p className="text-sm">
                  {formatTargetType(
                    promotion.application_method?.target_type || "-"
                  )}
                </p>
              </div>
              {promotion.application_method?.allocation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Allocation
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
                Rules
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
            <h2 className="text-lg font-semibold">Quick Info</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusInfo(promotion)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                {getTypeBadge(promotion.type)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Automatic
                </span>
                <span className="text-sm font-medium">
                  {promotion.is_automatic ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {format(new Date(promotion.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
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
              Schedule
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Start Date
                </p>
                <p className="text-sm">
                  {promotion.starts_at
                    ? format(
                        new Date(promotion.starts_at),
                        "MMM d, yyyy HH:mm"
                      )
                    : "No start date (active immediately)"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  End Date
                </p>
                <p className="text-sm">
                  {promotion.ends_at
                    ? format(
                        new Date(promotion.ends_at),
                        "MMM d, yyyy HH:mm"
                      )
                    : "No end date (runs indefinitely)"}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign */}
          {promotion.campaign && (
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Campaign
              </h2>
              <p className="text-sm font-medium">{promotion.campaign.name}</p>
            </div>
          )}

          {/* Promotion ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Promotion ID
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
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the promotion{" "}
              <strong>{promotion.code}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePromotion.isPending}
            >
              {deletePromotion.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
