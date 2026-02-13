"use client"

import { useTranslations } from "next-intl"
import { CollectionItem } from "@/hooks/use-curated-collections"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, X } from "lucide-react"
import Link from "next/link"

interface CollectionItemCardProps {
  item: CollectionItem
  onRemove: (itemId: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst: boolean
  isLast: boolean
  isRemoving: boolean
}

export function CollectionItemCard({
  item,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isRemoving,
}: CollectionItemCardProps) {
  const t = useTranslations("collections")

  return (
    <div className="flex items-center justify-between rounded-md border p-4 bg-card">
      <div className="flex items-center gap-3">
        {/* Sort order controls */}
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={isFirst}
            title={t("items.moveUp")}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={isLast}
            title={t("items.moveDown")}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Thumbnail */}
        {item.product?.thumbnail ? (
          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={item.product.thumbnail}
              alt={item.product?.title || ""}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-muted-foreground">N/A</span>
          </div>
        )}

        {/* Product info */}
        <div className="min-w-0">
          <Link
            href={`/products/${item.product_id}`}
            className="font-medium hover:underline text-sm truncate block"
          >
            {item.product?.title || item.product_id}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            {item.product?.status && (
              <span className="text-xs text-muted-foreground capitalize">
                {item.product.status}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {t("items.sortOrder")}: {item.sort_order}
            </span>
          </div>
        </div>
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(item.id)}
        disabled={isRemoving}
        title={t("items.remove")}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
