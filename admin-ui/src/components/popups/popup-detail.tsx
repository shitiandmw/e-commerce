"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePopup, useDeletePopup } from "@/hooks/use-popups"
import { DeletePopupDialog } from "./delete-popup-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Maximize2,
  Calendar,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PopupDetailProps {
  popupId: string
}

export function PopupDetail({ popupId }: PopupDetailProps) {
  const t = useTranslations("popups")
  const router = useRouter()
  const { data, isLoading, isError, error } = usePopup(popupId)
  const deletePopup = useDeletePopup()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const popup = data?.popup

  const handleDelete = async () => {
    try {
      await deletePopup.mutateAsync(popupId)
      router.push("/popups")
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

  if (isError || !popup) {
    return (
      <div className="space-y-6">
        <Link href="/popups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToPopups")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("popupNotFound")}
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
          <Link href="/popups">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {popup.title || t("columns.untitled")}
              </h1>
              <Badge variant={popup.is_enabled ? "default" : "secondary"} className="mt-1">
                {popup.is_enabled ? t("columns.enabled") : t("columns.disabled")}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/popups/${popupId}/edit`}>
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
          {/* Popup Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Maximize2 className="h-5 w-5" />
              {t("detail.popupDetails")}
            </h2>

            {popup.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {popup.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noDescription")}
              </p>
            )}

            {popup.image_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("detail.image")}
                </p>
                <div className="w-full max-w-md h-48 rounded-md overflow-hidden bg-muted border">
                  <img
                    src={popup.image_url}
                    alt={popup.title || ""}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {(popup.button_text || popup.button_link) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {popup.button_text && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t("detail.buttonText")}
                    </p>
                    <p className="text-sm">{popup.button_text}</p>
                  </div>
                )}
                {popup.button_link && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t("detail.buttonLink")}
                    </p>
                    <a href={popup.button_link} className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      {popup.button_link}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trigger Configuration */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("detail.triggerConfig")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.triggerType")}
                </p>
                <p className="text-sm">{t(`triggerType.${popup.trigger_type}`)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.displayFrequency")}
                </p>
                <p className="text-sm">{t(`displayFrequency.${popup.display_frequency}`)}</p>
              </div>
            </div>

            {popup.trigger_type === "specific_page" && popup.target_page && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.targetPage")}
                </p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {popup.target_page}
                </code>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Maximize2 className="h-5 w-5" />
              {t("form.preview")}
            </h2>
            <div className="rounded-lg border bg-background p-4 max-w-sm mx-auto space-y-3">
              {popup.image_url && (
                <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
                  <img
                    src={popup.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {popup.title && (
                <h3 className="text-base font-semibold">{popup.title}</h3>
              )}
              {popup.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {popup.description}
                </p>
              )}
              {popup.button_text && (
                <Button size="sm" className="w-full" type="button">
                  {popup.button_text}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.status")}</span>
                <Badge variant={popup.is_enabled ? "default" : "secondary"}>
                  {popup.is_enabled ? t("columns.enabled") : t("columns.disabled")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.sortOrder")}</span>
                <span className="text-sm font-medium">{popup.sort_order}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(popup.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(popup.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Popup ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.popupId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {popup.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeletePopupDialog
        popup={popup}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deletePopup.isPending}
      />
    </div>
  )
}
