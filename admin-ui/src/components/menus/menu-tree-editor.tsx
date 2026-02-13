"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  MenuItem,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useReorderMenuItems,
} from "@/hooks/use-menus"
import { MenuItemForm } from "./menu-item-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react"

// Helper: count all descendants
function countDescendants(item: MenuItem): number {
  let count = 0
  if (item.children) {
    for (const child of item.children) {
      count += 1 + countDescendants(child)
    }
  }
  return count
}

// Helper: collect all items in a flat list with sort info
function collectAllItems(
  items: MenuItem[],
  parentId: string | null = null
): Array<{ id: string; sort_order: number; parent_id: string | null }> {
  const result: Array<{
    id: string
    sort_order: number
    parent_id: string | null
  }> = []
  items.forEach((item, index) => {
    result.push({
      id: item.id,
      sort_order: index,
      parent_id: parentId,
    })
    if (item.children && item.children.length > 0) {
      result.push(...collectAllItems(item.children, item.id))
    }
  })
  return result
}

// Helper: deep clone items and swap sort order
function swapItems(items: MenuItem[], index: number, direction: "up" | "down"): MenuItem[] {
  const newItems = [...items]
  const targetIndex = direction === "up" ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= newItems.length) return newItems
  const temp = newItems[index]
  newItems[index] = newItems[targetIndex]
  newItems[targetIndex] = temp
  return newItems
}

// Helper: deep apply swap in nested tree
function applySwapInTree(
  tree: MenuItem[],
  parentId: string | null,
  index: number,
  direction: "up" | "down"
): MenuItem[] {
  if (parentId === null) {
    return swapItems(tree, index, direction)
  }
  return tree.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        children: swapItems(item.children || [], index, direction),
      }
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: applySwapInTree(item.children, parentId, index, direction),
      }
    }
    return item
  })
}

interface MenuTreeEditorProps {
  menuId: string
  items: MenuItem[]
}

export function MenuTreeEditor({ menuId, items: initialItems }: MenuTreeEditorProps) {
  const t = useTranslations("menus")
  const createMenuItem = useCreateMenuItem(menuId)
  const updateMenuItem = useUpdateMenuItem(menuId)
  const deleteMenuItem = useDeleteMenuItem(menuId)
  const reorderMenuItems = useReorderMenuItems(menuId)

  // Local tree state for reordering
  const [localItems, setLocalItems] = React.useState<MenuItem[]>(initialItems)
  const [hasOrderChanges, setHasOrderChanges] = React.useState(false)

  // Sync from props when server data updates (and no local changes pending)
  React.useEffect(() => {
    if (!hasOrderChanges) {
      setLocalItems(initialItems)
    }
  }, [initialItems, hasOrderChanges])

  // Collapsed state
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

  // Item form state
  const [itemFormOpen, setItemFormOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<MenuItem | undefined>(undefined)
  const [defaultParentId, setDefaultParentId] = React.useState<string | null>(null)

  // Delete confirm state
  const [itemToDelete, setItemToDelete] = React.useState<MenuItem | null>(null)

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Add top-level item
  const handleAddItem = () => {
    setEditingItem(undefined)
    setDefaultParentId(null)
    setItemFormOpen(true)
  }

  // Add child item
  const handleAddChild = (parentId: string) => {
    setEditingItem(undefined)
    setDefaultParentId(parentId)
    setItemFormOpen(true)
  }

  // Edit item
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setDefaultParentId(null)
    setItemFormOpen(true)
  }

  // Handle form submit
  const handleItemFormSubmit = async (data: {
    label: string
    url: string
    icon_url?: string
    is_enabled: boolean
    parent_id?: string | null
    metadata?: Record<string, unknown>
  }) => {
    try {
      if (editingItem) {
        await updateMenuItem.mutateAsync({
          itemId: editingItem.id,
          data,
        })
      } else {
        await createMenuItem.mutateAsync({
          ...data,
          sort_order: 999, // Append to end
        })
      }
      setItemFormOpen(false)
      setEditingItem(undefined)
      setHasOrderChanges(false) // Force refresh from server
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Delete item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    try {
      await deleteMenuItem.mutateAsync(itemToDelete.id)
      setItemToDelete(null)
      setHasOrderChanges(false) // Force refresh from server
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Move item up/down within siblings
  const handleMove = (
    parentId: string | null,
    index: number,
    direction: "up" | "down"
  ) => {
    setLocalItems((prev) => applySwapInTree(prev, parentId, index, direction))
    setHasOrderChanges(true)
  }

  // Save ordering
  const handleSaveOrder = async () => {
    const allItems = collectAllItems(localItems)
    try {
      await reorderMenuItems.mutateAsync(allItems)
      setHasOrderChanges(false)
    } catch (err) {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("tree.menuItems")}</h2>
        <div className="flex items-center gap-2">
          {hasOrderChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveOrder}
              disabled={reorderMenuItems.isPending}
            >
              {reorderMenuItems.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("tree.savingOrder")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("tree.saveOrder")}
                </>
              )}
            </Button>
          )}
          <Button size="sm" onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            {t("tree.addItem")}
          </Button>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasOrderChanges && (
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          {t("tree.hasUnsavedChanges")}
        </div>
      )}

      {/* Tree */}
      {localItems.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">{t("tree.noItems")}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <TreeNodeList
            items={localItems}
            parentId={null}
            depth={0}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onEdit={handleEditItem}
            onDelete={setItemToDelete}
            onAddChild={handleAddChild}
            onMove={handleMove}
            t={t}
          />
        </div>
      )}

      {/* Menu Item Form Dialog */}
      <MenuItemForm
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        onSubmit={handleItemFormSubmit}
        isLoading={createMenuItem.isPending || updateMenuItem.isPending}
        item={editingItem}
        allItems={localItems}
        defaultParentId={defaultParentId}
      />

      {/* Delete Item Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => { if (!open) setItemToDelete(null) }}>
        <DialogContent onClose={() => setItemToDelete(null)}>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="mt-4">{t("tree.deleteItemTitle")}</DialogTitle>
            <DialogDescription>
              {t("tree.deleteItemDescription", {
                label: itemToDelete?.label ?? "",
              })}
            </DialogDescription>
            {itemToDelete &&
              itemToDelete.children &&
              itemToDelete.children.length > 0 && (
                <div className="mt-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                  {t("tree.deleteItemWithChildren", {
                    count: countDescendants(itemToDelete),
                  })}
                </div>
              )}
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setItemToDelete(null)}
              disabled={deleteMenuItem.isPending}
            >
              {t("itemForm.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={deleteMenuItem.isPending}
            >
              {deleteMenuItem.isPending
                ? t("deleteDialog.deleting")
                : t("tree.deleteItem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Recursive tree node list component
interface TreeNodeListProps {
  items: MenuItem[]
  parentId: string | null
  depth: number
  collapsed: Set<string>
  onToggleCollapse: (id: string) => void
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onAddChild: (parentId: string) => void
  onMove: (parentId: string | null, index: number, direction: "up" | "down") => void
  t: ReturnType<typeof import("next-intl").useTranslations>
}

function TreeNodeList({
  items,
  parentId,
  depth,
  collapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAddChild,
  onMove,
  t,
}: TreeNodeListProps) {
  return (
    <div>
      {items.map((item, index) => {
        const hasChildren = item.children && item.children.length > 0
        const isCollapsed = collapsed.has(item.id)
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <div key={item.id}>
            <div
              className={`flex items-center gap-2 px-4 py-2.5 border-b last:border-b-0 hover:bg-accent/50 transition-colors ${
                !item.is_enabled ? "opacity-50" : ""
              }`}
              style={{ paddingLeft: `${depth * 24 + 16}px` }}
            >
              {/* Expand/Collapse */}
              <button
                onClick={() => hasChildren && onToggleCollapse(item.id)}
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  hasChildren
                    ? "hover:bg-accent cursor-pointer"
                    : "invisible"
                }`}
                title={isCollapsed ? t("tree.expand") : t("tree.collapse")}
              >
                {hasChildren &&
                  (isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  ))}
              </button>

              {/* Label & URL */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
                <span className="ml-2 text-xs text-muted-foreground truncate">
                  {item.url}
                </span>
              </div>

              {/* Status Badge */}
              <Badge
                variant={item.is_enabled ? "secondary" : "outline"}
                className="text-xs"
              >
                {item.is_enabled ? t("tree.enabled") : t("tree.disabled")}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Move Up */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isFirst}
                  onClick={() => onMove(parentId, index, "up")}
                  title={t("tree.moveUp")}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>

                {/* Move Down */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isLast}
                  onClick={() => onMove(parentId, index, "down")}
                  title={t("tree.moveDown")}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>

                {/* Add Child */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onAddChild(item.id)}
                  title={t("tree.addChildItem")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>

                {/* Edit */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(item)}
                  title={t("tree.editItem")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item)}
                  title={t("tree.deleteItem")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Children */}
            {hasChildren && !isCollapsed && (
              <TreeNodeList
                items={item.children}
                parentId={item.id}
                depth={depth + 1}
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onMove={onMove}
                t={t}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
