"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  useAnnouncements,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  Announcement,
} from "@/hooks/use-announcements"
import { AnnouncementForm } from "./announcement-form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

export function AnnouncementList() {
  const t = useTranslations("announcements")
  const { data, isLoading, isError, error } = useAnnouncements()
  const deleteAnnouncement = useDeleteAnnouncement()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingAnnouncement, setEditingAnnouncement] =
    React.useState<Announcement | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] =
    React.useState<Announcement | null>(null)

  const announcements = React.useMemo(() => {
    if (!data?.announcements) return []
    return [...data.announcements].sort((a, b) => a.sort_order - b.sort_order)
  }, [data?.announcements])

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormOpen(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingAnnouncement) return
    try {
      await deleteAnnouncement.mutateAsync(deletingAnnouncement.id)
      setDeletingAnnouncement(null)
    } catch {
      // Error handled by mutation
    }
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return "-"
    }
  }

  const truncateText = (text: string, maxLen: number = 60) => {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + "..."
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addAnnouncement")}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">{t("columns.sort")}</TableHead>
              <TableHead>{t("columns.text")}</TableHead>
              <TableHead className="w-[180px]">{t("columns.link")}</TableHead>
              <TableHead className="w-[80px] text-center">
                {t("columns.enabled")}
              </TableHead>
              <TableHead className="w-[160px]">
                {t("columns.startsAt")}
              </TableHead>
              <TableHead className="w-[160px]">
                {t("columns.endsAt")}
              </TableHead>
              <TableHead className="w-[140px] text-center">
                {t("columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-8 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="mx-auto h-5 w-9" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="text-destructive">
                    {t("table.errorLoading")}:{" "}
                    {error instanceof Error
                      ? error.message
                      : t("table.unknownError")}
                  </div>
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {t("table.noAnnouncements")}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement, index) => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                  index={index}
                  total={announcements.length}
                  announcements={announcements}
                  onEdit={handleEdit}
                  onDelete={setDeletingAnnouncement}
                  formatDateTime={formatDateTime}
                  truncateText={truncateText}
                  t={t}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <AnnouncementForm
        announcement={editingAnnouncement}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingAnnouncement}
        onOpenChange={(open) => {
          if (!open) setDeletingAnnouncement(null)
        }}
      >
        <DialogContent
          onClose={() => setDeletingAnnouncement(null)}
        >
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="mt-4">
              {t("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description", {
                text: truncateText(deletingAnnouncement?.text ?? "", 40),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDeletingAnnouncement(null)}
              disabled={deleteAnnouncement.isPending}
            >
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteAnnouncement.isPending}
            >
              {deleteAnnouncement.isPending
                ? t("deleteDialog.deleting")
                : t("deleteDialog.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Individual row with inline switch toggle and move up/down buttons */
function AnnouncementRow({
  announcement,
  index,
  total,
  announcements,
  onEdit,
  onDelete,
  formatDateTime,
  truncateText,
  t,
}: {
  announcement: Announcement
  index: number
  total: number
  announcements: Announcement[]
  onEdit: (a: Announcement) => void
  onDelete: (a: Announcement) => void
  formatDateTime: (d?: string | null) => string
  truncateText: (s: string, n?: number) => string
  t: ReturnType<typeof useTranslations>
}) {
  const updateAnnouncement = useUpdateAnnouncement(announcement.id)

  const handleToggleEnabled = async (checked: boolean) => {
    await updateAnnouncement.mutateAsync({ is_enabled: checked })
  }

  const handleMoveUp = async () => {
    if (index <= 0) return
    const prev = announcements[index - 1]
    // Swap sort_order values
    await Promise.all([
      updateAnnouncement.mutateAsync({ sort_order: prev.sort_order }),
      // We need to update the other one too - use a separate hook instance via fetch
      swapSortOrder(prev.id, announcement.sort_order),
    ])
  }

  const handleMoveDown = async () => {
    if (index >= total - 1) return
    const next = announcements[index + 1]
    await Promise.all([
      updateAnnouncement.mutateAsync({ sort_order: next.sort_order }),
      swapSortOrder(next.id, announcement.sort_order),
    ])
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === 0 || updateAnnouncement.isPending}
            onClick={handleMoveUp}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {announcement.sort_order}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === total - 1 || updateAnnouncement.isPending}
            onClick={handleMoveDown}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm" title={announcement.text}>
          {truncateText(announcement.text)}
        </span>
      </TableCell>
      <TableCell>
        {announcement.link_url ? (
          <a
            href={announcement.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            title={announcement.link_url}
          >
            {truncateText(announcement.link_url, 30)}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={announcement.is_enabled}
          onCheckedChange={handleToggleEnabled}
          disabled={updateAnnouncement.isPending}
        />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDateTime(announcement.starts_at)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDateTime(announcement.ends_at)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(announcement)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(announcement)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Helper to update sort_order of another announcement.
 * We use adminFetch directly since we can't use hooks outside of a component.
 */
async function swapSortOrder(id: string, newSortOrder: number) {
  const { adminFetch } = await import("@/lib/admin-api")
  await adminFetch(`/admin/announcements/${id}`, {
    method: "POST",
    body: { sort_order: newSortOrder },
  })
}
