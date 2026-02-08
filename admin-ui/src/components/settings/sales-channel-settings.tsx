"use client"

import * as React from "react"
import {
  useSalesChannels,
  useCreateSalesChannel,
  useUpdateSalesChannel,
  useDeleteSalesChannel,
  type AdminSalesChannel,
} from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"

export function SalesChannelSettings() {
  const { data, isLoading } = useSalesChannels()
  const deleteSalesChannel = useDeleteSalesChannel()

  const [showCreate, setShowCreate] = React.useState(false)
  const [editChannel, setEditChannel] = React.useState<AdminSalesChannel | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const channels = data?.sales_channels || []

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSalesChannel.mutateAsync(deleteId)
      setDeleteId(null)
    } catch {
      // shown in mutation state
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sales Channels</h2>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Sales channels represent different storefronts or platforms where you sell products.
        </p>

        {channels.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No sales channels configured.
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-start justify-between rounded-md border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ch.name}</span>
                    <Badge variant={ch.is_disabled ? "secondary" : "success"}>
                      {ch.is_disabled ? "Disabled" : "Active"}
                    </Badge>
                  </div>
                  {ch.description && (
                    <p className="text-sm text-muted-foreground">
                      {ch.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(ch.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditChannel(ch)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(ch.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <SalesChannelFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        mode="create"
      />

      {/* Edit Dialog */}
      {editChannel && (
        <SalesChannelFormDialog
          open={!!editChannel}
          onOpenChange={(open) => !open && setEditChannel(null)}
          mode="edit"
          channel={editChannel}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Delete Sales Channel</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete this sales channel? Products will no longer be available through it.
          </p>
          {deleteSalesChannel.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteSalesChannel.error instanceof Error
                ? deleteSalesChannel.error.message
                : "Failed to delete sales channel"}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSalesChannel.isPending}
            >
              {deleteSalesChannel.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---- Form Dialog ----

interface SalesChannelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  channel?: AdminSalesChannel
}

function SalesChannelFormDialog({
  open,
  onOpenChange,
  mode,
  channel,
}: SalesChannelFormDialogProps) {
  const createChannel = useCreateSalesChannel()
  const updateChannel = useUpdateSalesChannel(channel?.id || "")

  const [name, setName] = React.useState(channel?.name || "")
  const [description, setDescription] = React.useState(channel?.description || "")
  const [isDisabled, setIsDisabled] = React.useState(channel?.is_disabled || false)

  React.useEffect(() => {
    if (channel) {
      setName(channel.name)
      setDescription(channel.description || "")
      setIsDisabled(channel.is_disabled)
    } else {
      setName("")
      setDescription("")
      setIsDisabled(false)
    }
  }, [channel, open])

  const handleSubmit = async () => {
    try {
      if (mode === "create") {
        await createChannel.mutateAsync({
          name,
          description: description || undefined,
          is_disabled: isDisabled,
        })
      } else {
        await updateChannel.mutateAsync({
          name,
          description: description || undefined,
          is_disabled: isDisabled,
        })
      }
      onOpenChange(false)
    } catch {
      // shown in dialog
    }
  }

  const isPending =
    mode === "create" ? createChannel.isPending : updateChannel.isPending
  const error = mode === "create" ? createChannel.error : updateChannel.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Sales Channel" : "Edit Sales Channel"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sc-name">Name</Label>
            <Input
              id="sc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Web Store"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sc-description">Description</Label>
            <Textarea
              id="sc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this sales channel..."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="sc-disabled"
              type="checkbox"
              checked={isDisabled}
              onChange={(e) => setIsDisabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="sc-disabled" className="cursor-pointer">
              Disabled
            </Label>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error instanceof Error ? error.message : "An error occurred"}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
