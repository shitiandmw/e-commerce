"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePage, useDeletePage } from "@/hooks/use-pages"
import { DeletePageDialog } from "./delete-page-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PageDetailProps {
  pageId: string
}

export function PageDetail({ pageId }: PageDetailProps) {
  const t = useTranslations("pages")
  const router = useRouter()
  const { data, isLoading, isError, error } = usePage(pageId)
  const deletePage = useDeletePage()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const page = data?.page

  const handleDelete = async () => {
    try {
      await deletePage.mutateAsync(pageId)
      router.push("/pages")
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

  if (isError || !page) {
    return (
      <div className="space-y-6">
        <Link href="/pages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToPages")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("pageNotFound")}
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
          <Link href="/pages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {page.title}
              </h1>
              <Badge
                variant={page.status === "published" ? "default" : "secondary"}
              >
                {t(`status.${page.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pages/${pageId}/edit`}>
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
          {/* Page Content */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("detail.pageContent")}
            </h2>

            {page.content ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noContent")}
              </p>
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
                <span className="text-sm text-muted-foreground">{t("detail.status")}</span>
                <Badge
                  variant={page.status === "published" ? "default" : "secondary"}
                >
                  {t(`status.${page.status}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.template")}</span>
                <span className="text-sm font-medium">
                  {page.template ? t(`templates.${page.template}`) : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.sortOrder")}</span>
                <span className="text-sm font-medium">{page.sort_order}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(page.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(page.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Page ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.pageId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {page.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeletePageDialog
        page={page}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deletePage.isPending}
      />
    </div>
  )
}
