"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MediaFile } from "@/hooks/use-media"
import { cn } from "@/lib/utils"
import {
  ImageIcon,
  FileIcon,
  Film,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  LayoutGrid,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "grid" | "list"

interface MediaGridProps {
  files: MediaFile[]
  isLoading?: boolean
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onDelete?: (file: MediaFile) => void
  onSelect?: (file: MediaFile) => void
  selectable?: boolean
  selectedUrls?: string[]
}

export function MediaGrid({
  files,
  isLoading,
  viewMode = "grid",
  onViewModeChange,
  onDelete,
  onSelect,
  selectable,
  selectedUrls = [],
}: MediaGridProps) {
  const t = useTranslations("media")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const copyToClipboard = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div>
        {onViewModeChange && (
          <div className="flex justify-end mb-4">
            <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
          </div>
        )}
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : "space-y-2"
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                viewMode === "grid"
                  ? "aspect-square rounded-lg"
                  : "h-16 rounded-md"
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">{t("grid.noFiles")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("grid.uploadToStart")}
        </p>
      </div>
    )
  }

  return (
    <div>
      {onViewModeChange && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {t("grid.fileCount", { count: files.length })}
          </p>
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file) => (
            <GridItem
              key={file.id}
              file={file}
              isSelected={selectedUrls.includes(file.url)}
              selectable={selectable}
              onSelect={onSelect}
              onDelete={onDelete}
              onCopy={copyToClipboard}
              copied={copiedId === file.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <ListItem
              key={file.id}
              file={file}
              isSelected={selectedUrls.includes(file.url)}
              selectable={selectable}
              onSelect={onSelect}
              onDelete={onDelete}
              onCopy={copyToClipboard}
              copied={copiedId === file.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Sub-components
function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div className="flex items-center rounded-md border bg-background">
      <Button
        variant={mode === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => onChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}

function getFileIcon(url: string) {
  const lower = url.toLowerCase()
  if (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov")
  ) {
    return Film
  }
  if (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".gif") ||
    lower.includes(".webp") ||
    lower.includes(".svg")
  ) {
    return ImageIcon
  }
  return FileIcon
}

function isImage(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".gif") ||
    lower.includes(".webp") ||
    lower.includes(".svg") ||
    lower.includes("image") // Medusa may return URLs with "image" in them
  )
}

function getFileName(file: MediaFile): string {
  if (file.key) return file.key.split("/").pop() || file.key
  try {
    const url = new URL(file.url)
    return url.pathname.split("/").pop() || "unknown"
  } catch {
    return file.url.split("/").pop() || "unknown"
  }
}

interface ItemProps {
  file: MediaFile
  isSelected?: boolean
  selectable?: boolean
  onSelect?: (file: MediaFile) => void
  onDelete?: (file: MediaFile) => void
  onCopy: (url: string, id: string) => void
  copied: boolean
}

function GridItem({
  file,
  isSelected,
  selectable,
  onSelect,
  onDelete,
  onCopy,
  copied,
}: ItemProps) {
  const t = useTranslations("media")
  const Icon = getFileIcon(file.url)
  const showImage = isImage(file.url)

  return (
    <div
      className={cn(
        "group relative aspect-square rounded-lg border bg-muted/30 overflow-hidden transition-all",
        selectable && "cursor-pointer",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={() => selectable && onSelect?.(file)}
    >
      {/* Preview */}
      {showImage ? (
        <img
          src={file.url}
          alt={getFileName(file)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}

      {/* Selection indicator */}
      {selectable && isSelected && (
        <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex w-full items-center justify-between p-2">
          <p className="text-xs text-white truncate flex-1 mr-2">
            {getFileName(file)}
          </p>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCopy(file.url, file.id)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white hover:bg-white/30 transition-colors"
              title={t("grid.copyUrl")}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white hover:bg-white/30 transition-colors"
              title={t("grid.openInNewTab")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(file)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/80 text-white hover:bg-destructive transition-colors"
                title={t("grid.delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ListItem({
  file,
  isSelected,
  selectable,
  onSelect,
  onDelete,
  onCopy,
  copied,
}: ItemProps) {
  const t = useTranslations("media")
  const Icon = getFileIcon(file.url)
  const showImage = isImage(file.url)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border p-3 transition-all hover:bg-accent/50",
        selectable && "cursor-pointer",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5"
      )}
      onClick={() => selectable && onSelect?.(file)}
    >
      {/* Thumbnail */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted overflow-hidden">
        {showImage ? (
          <img
            src={file.url}
            alt={getFileName(file)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="h-6 w-6 text-muted-foreground/50" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{getFileName(file)}</p>
        <p className="text-xs text-muted-foreground truncate">{file.url}</p>
      </div>

      {/* Selection indicator */}
      {selectable && isSelected && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onCopy(file.url, file.id)
          }}
          title={t("grid.copyUrl")}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="icon" className="h-8 w-8" title={t("grid.open")}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(file)
            }}
            title={t("grid.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
