"use client"

import { MediaFile, useDeleteMedia } from "@/hooks/use-media"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DeleteMediaDialogProps {
  file: MediaFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMediaDialog({
  file,
  open,
  onOpenChange,
}: DeleteMediaDialogProps) {
  const deleteMedia = useDeleteMedia()

  const handleDelete = async () => {
    if (!file) return
    try {
      await deleteMedia.mutateAsync(file.id)
      onOpenChange(false)
    } catch {
      // Error handled by mutation state
    }
  }

  const fileName = file
    ? file.key?.split("/").pop() ||
      file.url.split("/").pop() ||
      "this file"
    : "this file"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Delete Media</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{fileName}</strong>? This
            action cannot be undone. Any references to this file will be broken.
          </DialogDescription>
        </DialogHeader>

        {deleteMedia.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {deleteMedia.error instanceof Error
              ? deleteMedia.error.message
              : "Failed to delete file"}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMedia.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMedia.isPending}
          >
            {deleteMedia.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
