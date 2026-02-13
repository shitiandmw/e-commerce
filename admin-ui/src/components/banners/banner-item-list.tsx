"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  BannerItem,
  useBannerItems,
  useUpdateBannerItem,
  useDeleteBannerItem,
} from "@/hooks/use-banners"
import { BannerItemForm } from "./banner-item-form"
import { DeleteBannerDialog } from "./delete-banner-dialog"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { format } from "date-fns"

interface BannerItemListProps {
  slotId: string
}

function getItemStatus(
  item: BannerItem,
  t: (key: string) => string
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const now = new Date()
  if (item.starts_at && new Date(item.starts_at) > now) {
    return { label: t("items.scheduled"), variant: "outline" }
  }
  if (item.ends_at && new Date(item.ends_at) < now) {
    return { label: t("items.expired"), variant: "destructive" }
  }
  if (item.is_enabled) {
    return { label: t("items.activeNow"), variant: "default" }
  }
  return { label: t("items.disabled"), variant: "secondary" }
}

export function BannerItemList({ slotId }: BannerItemListProps) {
  const t = useTranslations("banners")
  const { data, isLoading } = useBannerItems(slotId)
  const deleteItem = useDeleteBannerItem()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<BannerItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<BannerItem | null>(null)

  const items = React.useMemo(() => {
    if (!data?.banner_items) return []
    return [...data.banner_items].sort((a, b) => a.sort_order - b.sort_order)
  }, [data?.banner_items])

  const handleEdit = (item: BannerItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      await deleteItem.mutateAsync(itemToDelete.id)
      setItemToDelete(null)
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {t("items.title")}
          <Badge variant="secondary">{items.length}</Badge>
        </h2>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("items.addItem")}
        </Button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("items.noItems")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <BannerItemCard
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onEdit={handleEdit}
              onDelete={setItemToDelete}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Item Form Dialog */}
      <BannerItemForm
        slotId={slotId}
        item={editingItem}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Delete Dialog */}
      <DeleteBannerDialog
        type="item"
        open={!!itemToDelete}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteItem.isPending}
      />
    </div>
  )
}

interface BannerItemCardProps {
  item: BannerItem
  index: number
  total: number
  onEdit: (item: BannerItem) => void
  onDelete: (item: BannerItem) => void
  t: (key: string) => string
}

function BannerItemCard({
  item,
  index,
  total,
  onEdit,
  onDelete,
  t,
}: BannerItemCardProps) {
  const updateItem = useUpdateBannerItem(item.id)
  const status = getItemStatus(item, t)

  const handleToggleEnabled = async () => {
    try {
      await updateItem.mutateAsync({ is_enabled: !item.is_enabled })
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleMove = async (direction: "up" | "down") => {
    const newOrder =
      direction === "up"
        ? Math.max(0, item.sort_order - 1)
        : item.sort_order + 1
    try {
      await updateItem.mutateAsync({ sort_order: newOrder })
    } catch (err) {
      // Error handled by mutation
    }
  }

  return (
    <div className="group rounded-lg border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title || "Banner"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>

        {/* Sort order badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            #{item.sort_order}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-medium text-sm line-clamp-1">
            {item.title || t("items.noTitle")}
          </h3>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.subtitle}
            </p>
          )}
        </div>

        {/* Link */}
        {item.link_url && (
          <a
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{item.link_url}</span>
          </a>
        )}

        {/* Date Range */}
        {(item.starts_at || item.ends_at) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {item.starts_at
                ? format(new Date(item.starts_at), "MM/dd HH:mm")
                : "—"}
              {" → "}
              {item.ends_at
                ? format(new Date(item.ends_at), "MM/dd HH:mm")
                : "—"}
            </span>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={item.is_enabled}
              onCheckedChange={handleToggleEnabled}
            />
            <span className="text-xs text-muted-foreground">
              {item.is_enabled ? t("items.enabled") : t("items.disabled")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMove("up")}
              disabled={index === 0}
              title={t("items.moveUp")}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMove("down")}
              disabled={index === total - 1}
              title={t("items.moveDown")}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
