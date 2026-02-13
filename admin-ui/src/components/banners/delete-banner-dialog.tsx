"use client"

import { useTranslations } from "next-intl"
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

interface DeleteBannerDialogProps {
  type: "slot" | "item"
  name?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export function DeleteBannerDialog({
  type,
  name,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteBannerDialogProps) {
  const t = useTranslations("banners")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="mt-4">
            {type === "slot"
              ? t("deleteDialog.title")
              : t("deleteDialog.itemTitle")}
          </DialogTitle>
          <DialogDescription>
            {type === "slot"
              ? t("deleteDialog.slotDescription", { name: name ?? "" })
              : t("deleteDialog.itemDescription")}
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
            {isLoading ? t("deleteDialog.deleting") : t("deleteDialog.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
