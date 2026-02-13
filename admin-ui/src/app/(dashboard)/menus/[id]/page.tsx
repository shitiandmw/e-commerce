"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMenu, useDeleteMenu } from "@/hooks/use-menus"
import { MenuTreeEditor } from "@/components/menus/menu-tree-editor"
import { DeleteMenuDialog } from "@/components/menus/delete-menu-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  List,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function MenuDetailPage() {
  const t = useTranslations("menus")
  const params = useParams()
  const router = useRouter()
  const menuId = params.id as string
  const { data, isLoading, isError, error } = useMenu(menuId)
  const deleteMenu = useDeleteMenu()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const menu = data?.menu

  const handleDelete = async () => {
    try {
      await deleteMenu.mutateAsync(menuId)
      router.push("/menus")
    } catch (err) {
      // Handled by mutation
    }
  }

  // Count total items recursively
  const countItems = (items: any[]): number => {
    let count = 0
    for (const item of items) {
      count += 1
      if (item.children) {
        count += countItems(item.children)
      }
    }
    return count
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

  if (isError || !menu) {
    return (
      <div className="space-y-6">
        <Link href="/menus">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToMenus")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("menuNotFound")}
          </p>
        </div>
      </div>
    )
  }

  const totalItemCount = countItems(menu.items || [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/menus">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {menu.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {menu.key}
              </code>
              {menu.description && (
                <span className="text-sm text-muted-foreground">
                  {menu.description}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/menus/${menuId}/edit`}>
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
        {/* Main Content: Tree Editor */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <MenuTreeEditor
              menuId={menuId}
              items={menu.items || []}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">{t("detail.quickInfo")}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.key")}</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {menu.key}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.itemCount")}</span>
                <Badge variant="secondary">{totalItemCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.created")}</span>
                <span className="text-sm">
                  {format(new Date(menu.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("detail.updated")}</span>
                <span className="text-sm">
                  {format(new Date(menu.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5" />
              {t("detail.menuDetails")}
            </h2>
            {menu.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {menu.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noDescription")}
              </p>
            )}
          </div>

          {/* Menu ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.menuId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {menu.id}
            </code>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteMenuDialog
        menu={menu}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteMenu.isPending}
      />
    </div>
  )
}
