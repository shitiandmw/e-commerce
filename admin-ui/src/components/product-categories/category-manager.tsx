"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  type ProductCategory,
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
  buildProductCategoryTree,
} from "@/hooks/use-product-categories"
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
  FolderTree,
  ChevronRight,
} from "lucide-react"
import { toSlug } from "@/lib/slug"

export function ProductCategoryManager() {
  const t = useTranslations("productCategories")
  const { data, isLoading } = useProductCategories()
  const categories = data?.product_categories ?? []
  const treeList = React.useMemo(() => buildProductCategoryTree(categories), [categories])

  const [editingCategory, setEditingCategory] = React.useState<ProductCategory | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [deletingCategory, setDeletingCategory] = React.useState<ProductCategory | null>(null)

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
  }
  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            <h2 className="font-semibold">{t("title")}</h2>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addCategory")}
          </Button>
        </div>

        <div className="p-4 space-y-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))
          ) : treeList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("noCategories")}
            </p>
          ) : (
            treeList.map(({ category, depth }) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-md border p-3"
                style={{ marginLeft: depth * 24 }}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {depth > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{category.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        category.is_active !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {category.is_active !== false ? t("active") : t("inactive")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {category.handle}
                      {category.description && ` — ${category.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)} aria-label={`Edit ${category.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingCategory(category)} aria-label={`Delete ${category.name}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <CategoryFormDialog
          category={editingCategory}
          allCategories={categories}
          open={showForm}
          onOpenChange={(open) => { if (!open) handleCloseForm() }}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          open={!!deletingCategory}
          onOpenChange={(open) => { if (!open) setDeletingCategory(null) }}
        />
      )}
    </>
  )
}

// ─── Category Form Dialog ────────────────────────────────
function CategoryFormDialog({
  category,
  allCategories,
  open,
  onOpenChange,
}: {
  category: ProductCategory | null
  allCategories: ProductCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("productCategories")
  const isEdit = !!category
  const createCategory = useCreateProductCategory()
  const updateCategory = useUpdateProductCategory(category?.id || "")

  const [name, setName] = React.useState(category?.name || "")
  const [handle, setHandle] = React.useState(category?.handle || "")
  const [description, setDescription] = React.useState(category?.description || "")
  const [rank, setRank] = React.useState(String(category?.rank ?? 0))
  const [parentId, setParentId] = React.useState<string>(category?.parent_category_id || "")
  const [isActive, setIsActive] = React.useState(category?.is_active !== false)
  const [autoHandle, setAutoHandle] = React.useState(!isEdit)

  const parentOptions = React.useMemo(() => {
    if (!isEdit) return buildProductCategoryTree(allCategories)
    const excludeIds = new Set<string>()
    function collectDescendants(id: string) {
      excludeIds.add(id)
      for (const cat of allCategories) {
        if (cat.parent_category_id === id) collectDescendants(cat.id)
      }
    }
    collectDescendants(category!.id)
    return buildProductCategoryTree(allCategories).filter(
      ({ category: c }) => !excludeIds.has(c.id)
    )
  }, [allCategories, category, isEdit])

  React.useEffect(() => {
    if (autoHandle && name) {
      setHandle(toSlug(name))
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
        rank: rank ? Number(rank) : undefined,
        parent_category_id: parentId || null,
        is_active: isActive,
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
          <DialogTitle>{isEdit ? t("editCategory") : t("addCategory")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mutationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutationError instanceof Error ? mutationError.message : "Error"}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("nameLabel")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} required />
          </div>

          <div className="space-y-2">
            <Label>{t("handleLabel")}</Label>
            <Input value={handle} onChange={(e) => { setHandle(e.target.value); setAutoHandle(false) }} placeholder={t("handlePlaceholder")} required />
          </div>

          <div className="space-y-2">
            <Label>{t("descriptionLabel")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>{t("parentLabel")}</Label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{t("noParent")}</option>
              {parentOptions.map(({ category: c, depth }) => (
                <option key={c.id} value={c.id}>{"—".repeat(depth)} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t("rankLabel")}</Label>
            <Input type="number" value={rank} onChange={(e) => setRank(e.target.value)} placeholder={t("rankPlaceholder")} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="is_active">{t("isActiveLabel")}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t("cancel")}</Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("saving")}</>) : t("save")}
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
  category: ProductCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("productCategories")
  const deleteCategory = useDeleteProductCategory()

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
          <DialogDescription>{t("deleteDescription", { name: category.name })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteCategory.isPending}>{t("cancel")}</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteCategory.isPending}>
            {deleteCategory.isPending ? t("deleting") : t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
