"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useBannerSlot, useDeleteBannerSlot } from "@/hooks/use-banners"
import { BannerItemList } from "@/components/banners/banner-item-list"
import { DeleteBannerDialog } from "@/components/banners/delete-banner-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Layers,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function BannerSlotDetailPage() {
  const t = useTranslations("banners")
  const router = useRouter()
  const params = useParams()
  const slotId = params.id as string
  const { data, isLoading, isError, error } = useBannerSlot(slotId)
  const deleteSlot = useDeleteBannerSlot()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const slot = data?.banner_slot

  const handleDelete = async () => {
    try {
      await deleteSlot.mutateAsync(slotId)
      router.push("/banners")
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

  if (isError || !slot) {
    return (
      <div className="space-y-6">
        <Link href="/banners">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToSlots")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("slotNotFound")}
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
          <Link href="/banners">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {slot.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {slot.key}
              </code>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/banners/${slotId}/edit`}>
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
        {/* Main Content - Banner Items */}
        <div className="space-y-6 lg:col-span-2">
          <BannerItemList slotId={slotId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Slot Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {t("detail.slotInfo")}
            </h2>

            {slot.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {slot.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noDescription")}
              </p>
            )}
          </div>

          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.key")}</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {slot.key}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.bannerCount")}</span>
                <span className="text-sm font-medium">
                  {slot.items?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(slot.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(slot.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Slot ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.slotId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {slot.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteBannerDialog
        type="slot"
        name={slot.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteSlot.isPending}
      />
    </div>
  )
}
