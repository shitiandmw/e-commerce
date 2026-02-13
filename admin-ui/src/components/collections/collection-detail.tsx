"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  useCollection,
  useDeleteCollection,
  useCollectionTabs,
  useCreateTab,
  useUpdateTab,
  useDeleteTab,
  useCollectionItems,
  useUpdateCollectionItem,
  useRemoveCollectionItem,
  CollectionTab,
  CollectionItem,
} from "@/hooks/use-curated-collections"
import { DeleteCollectionDialog } from "./delete-collection-dialog"
import { ProductPickerDialog } from "./product-picker-dialog"
import { CollectionItemCard } from "./collection-item-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Package,
  LayoutGrid,
  Plus,
  Loader2,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface CollectionDetailProps {
  collectionId: string
}

export function CollectionDetail({ collectionId }: CollectionDetailProps) {
  const t = useTranslations("collections")
  const router = useRouter()

  // Collection data
  const { data, isLoading, isError, error } = useCollection(collectionId)
  const deleteCollection = useDeleteCollection()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  // Tabs
  const { data: tabsData } = useCollectionTabs(collectionId)
  const createTab = useCreateTab(collectionId)
  const updateTab = useUpdateTab(collectionId)
  const deleteTab = useDeleteTab(collectionId)

  // Tab dialog state
  const [tabDialogOpen, setTabDialogOpen] = React.useState(false)
  const [editingTab, setEditingTab] = React.useState<CollectionTab | null>(null)
  const [tabName, setTabName] = React.useState("")
  const [tabKey, setTabKey] = React.useState("")
  const [tabSortOrder, setTabSortOrder] = React.useState(0)
  const [tabSaving, setTabSaving] = React.useState(false)

  // Active tab filter
  const [activeTabId, setActiveTabId] = React.useState<string | undefined>(
    undefined
  )

  // Items
  const { data: itemsData } = useCollectionItems(collectionId, activeTabId)
  const updateItem = useUpdateCollectionItem(collectionId)
  const removeItem = useRemoveCollectionItem(collectionId)
  const [removingItemId, setRemovingItemId] = React.useState<string | null>(
    null
  )

  // Product picker
  const [showProductPicker, setShowProductPicker] = React.useState(false)

  const collection = data?.collection
  const tabs = tabsData?.tabs ?? collection?.tabs ?? []
  const items = itemsData?.items ?? []
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order)

  // ---- Handlers ----

  const handleDelete = async () => {
    try {
      await deleteCollection.mutateAsync(collectionId)
      router.push("/collections")
    } catch (err) {
      // Handled by mutation
    }
  }

  // Tab handlers
  const openTabDialog = (tab?: CollectionTab) => {
    if (tab) {
      setEditingTab(tab)
      setTabName(tab.name)
      setTabKey(tab.key)
      setTabSortOrder(tab.sort_order)
    } else {
      setEditingTab(null)
      setTabName("")
      setTabKey("")
      setTabSortOrder(tabs.length)
    }
    setTabDialogOpen(true)
  }

  const handleTabSave = async () => {
    setTabSaving(true)
    try {
      if (editingTab) {
        await updateTab.mutateAsync({
          tabId: editingTab.id,
          data: { name: tabName, key: tabKey, sort_order: tabSortOrder },
        })
      } else {
        await createTab.mutateAsync({
          name: tabName,
          key: tabKey,
          sort_order: tabSortOrder,
        })
      }
      setTabDialogOpen(false)
    } catch (err) {
      // handled by mutation
    } finally {
      setTabSaving(false)
    }
  }

  const handleTabDelete = async (tab: CollectionTab) => {
    if (!confirm(t("tabs.confirmDelete", { name: tab.name }))) return
    try {
      await deleteTab.mutateAsync(tab.id)
      if (activeTabId === tab.id) {
        setActiveTabId(undefined)
      }
    } catch (err) {
      // handled
    }
  }

  // Item handlers
  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId)
    try {
      await removeItem.mutateAsync(itemId)
    } catch (err) {
      // handled
    } finally {
      setRemovingItemId(null)
    }
  }

  const handleMoveItem = async (item: CollectionItem, direction: "up" | "down") => {
    const idx = sortedItems.findIndex((i) => i.id === item.id)
    if (idx < 0) return

    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedItems.length) return

    const otherItem = sortedItems[swapIdx]

    // Swap sort_order values
    try {
      await Promise.all([
        updateItem.mutateAsync({
          itemId: item.id,
          data: { sort_order: otherItem.sort_order },
        }),
        updateItem.mutateAsync({
          itemId: otherItem.id,
          data: { sort_order: item.sort_order },
        }),
      ])
    } catch (err) {
      // handled
    }
  }

  const existingProductIds = items.map((item) => item.product_id)

  // ---- Render ----

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
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !collection) {
    return (
      <div className="space-y-6">
        <Link href="/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToCollections")}
          </Button>
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : t("collectionNotFound")}
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
          <Link href="/collections">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {collection.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                {collection.key}
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/collections/${collectionId}/edit`}>
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
          {/* Collection Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {t("detail.collectionDetails")}
            </h2>

            {collection.description ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("detail.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {collection.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("detail.noDescription")}
              </p>
            )}
          </div>

          {/* Tabs Management */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                {t("tabs.title")}
                <Badge variant="secondary">{tabs.length}</Badge>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openTabDialog()}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t("tabs.addTab")}
              </Button>
            </div>

            {tabs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("tabs.noTabs")}
              </p>
            ) : (
              <div className="space-y-2">
                {[...tabs]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((tab) => (
                    <div
                      key={tab.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {tab.name}
                        </span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {tab.key}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          #{tab.sort_order}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openTabDialog(tab)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleTabDelete(tab)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Items / Products */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("items.title")}
                <Badge variant="secondary">{items.length}</Badge>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProductPicker(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t("items.addProduct")}
              </Button>
            </div>

            {/* Tab filter */}
            {tabs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTabId === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTabId(undefined)}
                >
                  {t("tabs.all")}
                </Button>
                {[...tabs]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTabId === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTabId(tab.id)}
                    >
                      {tab.name}
                    </Button>
                  ))}
              </div>
            )}

            {/* Item list */}
            {sortedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {activeTabId
                  ? t("items.noItemsInTab")
                  : t("items.noItems")}
              </p>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item, index) => (
                  <CollectionItemCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                    onMoveUp={() => handleMoveItem(item, "up")}
                    onMoveDown={() => handleMoveItem(item, "down")}
                    isFirst={index === 0}
                    isLast={index === sortedItems.length - 1}
                    isRemoving={removingItemId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">
              {t("detail.quickInfo")}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.key")}
                </span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {collection.key}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.sortOrder")}
                </span>
                <span className="text-sm font-medium">
                  {collection.sort_order}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.tabCount")}
                </span>
                <span className="text-sm font-medium">{tabs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.itemCount")}
                </span>
                <span className="text-sm font-medium">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.created")}
                </span>
                <span className="text-sm">
                  {format(new Date(collection.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("detail.updated")}
                </span>
                <span className="text-sm">
                  {format(new Date(collection.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Collection ID */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("detail.collectionId")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {collection.id}
            </code>
          </div>
        </div>
      </div>

      {/* Tab Dialog */}
      <Dialog open={tabDialogOpen} onOpenChange={setTabDialogOpen}>
        <DialogContent onClose={() => setTabDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingTab ? t("tabs.editTab") : t("tabs.addTab")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("tabs.nameLabel")}</Label>
              <Input
                value={tabName}
                onChange={(e) => setTabName(e.target.value)}
                placeholder={t("tabs.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("tabs.keyLabel")}</Label>
              <Input
                value={tabKey}
                onChange={(e) => setTabKey(e.target.value)}
                placeholder={t("tabs.keyPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("tabs.sortOrderLabel")}</Label>
              <Input
                type="number"
                value={tabSortOrder}
                onChange={(e) => setTabSortOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTabDialogOpen(false)}
              disabled={tabSaving}
            >
              {t("tabs.cancel")}
            </Button>
            <Button
              onClick={handleTabSave}
              disabled={tabSaving || !tabName.trim() || !tabKey.trim()}
            >
              {tabSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("tabs.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <DeleteCollectionDialog
        collection={collection}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={deleteCollection.isPending}
      />

      {/* Product Picker */}
      <ProductPickerDialog
        collectionId={collectionId}
        tabId={activeTabId}
        existingProductIds={existingProductIds}
        open={showProductPicker}
        onOpenChange={setShowProductPicker}
      />
    </div>
  )
}
