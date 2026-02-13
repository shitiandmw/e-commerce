"use client"

import { useTranslations } from "next-intl"
import { CuratedCollection } from "@/hooks/use-curated-collections"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteCollectionDialogProps {
  collection: CuratedCollection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteCollectionDialogProps) {
  const t = useTranslations("collections")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="mt-4">
            {t("deleteDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("deleteDialog.description", { name: collection?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("deleteDialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? t("deleteDialog.deleting")
              : t("deleteDialog.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
