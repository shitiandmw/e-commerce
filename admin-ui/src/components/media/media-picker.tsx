"use client"

import * as React from "react"
import { useMediaFiles, MediaFile } from "@/hooks/use-media"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MediaGrid } from "./media-grid"
import { MediaUploader } from "./media-uploader"
import { ImageIcon } from "lucide-react"

interface MediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (urls: string[]) => void
  multiple?: boolean
  selectedUrls?: string[]
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  selectedUrls: initialSelectedUrls = [],
}: MediaPickerProps) {
  const { data, isLoading, refetch } = useMediaFiles()
  const [selectedUrls, setSelectedUrls] = React.useState<string[]>(initialSelectedUrls)

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedUrls(initialSelectedUrls)
    }
  }, [open, initialSelectedUrls])

  const files = data?.files ?? []

  const handleFileSelect = (file: MediaFile) => {
    if (multiple) {
      setSelectedUrls((prev) =>
        prev.includes(file.url)
          ? prev.filter((u) => u !== file.url)
          : [...prev, file.url]
      )
    } else {
      setSelectedUrls([file.url])
    }
  }

  const handleConfirm = () => {
    onSelect(selectedUrls)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Select Media
            </div>
          </DialogTitle>
          <DialogDescription>
            {multiple
              ? "Select one or more files from your media library"
              : "Select a file from your media library"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0">
          {/* Upload Section */}
          <MediaUploader compact onUploadComplete={() => refetch()} />

          {/* File Grid */}
          <MediaGrid
            files={files}
            isLoading={isLoading}
            viewMode="grid"
            selectable
            selectedUrls={selectedUrls}
            onSelect={handleFileSelect}
          />
        </div>

        <DialogFooter className="mt-2">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedUrls.length > 0
                ? `${selectedUrls.length} file${selectedUrls.length !== 1 ? "s" : ""} selected`
                : "No files selected"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedUrls.length === 0}
              >
                {multiple ? "Add Selected" : "Select"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
