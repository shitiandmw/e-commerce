"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  ArticleCategory,
  useArticleCategories,
  useCreateArticleCategory,
  useUpdateArticleCategory,
  useDeleteArticleCategory,
} from "@/hooks/use-articles"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from "lucide-react"

interface ArticleCategoryManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArticleCategoryManager({
  open,
  onOpenChange,
}: ArticleCategoryManagerProps) {
  const t = useTranslations("articles.categories")
  const { data, isLoading } = useArticleCategories()
  const categories = data?.article_categories ?? []

  const [editingCategory, setEditingCategory] =
    React.useState<ArticleCategory | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [deletingCategory, setDeletingCategory] =
    React.useState<ArticleCategory | null>(null)

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const handleEdit = (category: ArticleCategory) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          onClose={() => onOpenChange(false)}
        >
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {t("title")}
              </div>
            </DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("noCategories")}
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {category.handle}
                      {category.description && ` — ${category.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addCategory")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Form Dialog */}
      {showForm && (
        <CategoryFormDialog
          category={editingCategory}
          open={showForm}
          onOpenChange={(open) => {
            if (!open) handleCloseForm()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          open={!!deletingCategory}
          onOpenChange={(open) => {
            if (!open) setDeletingCategory(null)
          }}
        />
      )}
    </>
  )
}

// ─── Category Form Dialog ────────────────────────────────

function CategoryFormDialog({
  category,
  open,
  onOpenChange,
}: {
  category: ArticleCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("articles.categories")
  const isEdit = !!category
  const createCategory = useCreateArticleCategory()
  const updateCategory = useUpdateArticleCategory(category?.id || "")

  const [name, setName] = React.useState(category?.name || "")
  const [handle, setHandle] = React.useState(category?.handle || "")
  const [description, setDescription] = React.useState(
    category?.description || ""
  )
  const [sortOrder, setSortOrder] = React.useState(
    String(category?.sort_order ?? 0)
  )
  const [autoHandle, setAutoHandle] = React.useState(!isEdit)

  // Auto-generate handle from name
  React.useEffect(() => {
    if (autoHandle && name) {
      setHandle(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
          .replace(/^-|-$/g, "")
      )
    }
  }, [name, autoHandle])

  const isPending = createCategory.isPending || updateCategory.isPending
  const mutationError = isEdit ? updateCategory.error : createCategory.error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !handle.trim()) return

    try {
      const payload = {
        name: name.trim(),
        handle: handle.trim(),
        description: description.trim() || undefined,
        sort_order: sortOrder ? Number(sortOrder) : undefined,
      }

      if (isEdit) {
        await updateCategory.mutateAsync(payload)
      } else {
        await createCategory.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editCategory") : t("addCategory")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mutationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : "Error"}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("nameLabel")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("handleLabel")}</Label>
            <Input
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value)
                setAutoHandle(false)
              }}
              placeholder={t("handlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("descriptionLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("sortOrderLabel")}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder={t("sortOrderPlaceholder")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Category Dialog ──────────────────────────────

function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: ArticleCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("articles.categories")
  const deleteCategory = useDeleteArticleCategory()

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id)
      onOpenChange(false)
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="mt-4">{t("deleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("deleteDescription", { name: category.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteCategory.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
          >
            {deleteCategory.isPending ? t("deleting") : t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
