"use client"

import * as React from "react"
import { useMediaFiles, MediaFile } from "@/hooks/use-media"
import { MediaGrid } from "@/components/media/media-grid"
import { MediaUploader } from "@/components/media/media-uploader"
import { DeleteMediaDialog } from "@/components/media/delete-media-dialog"

type ViewMode = "grid" | "list"

export default function MediaPage() {
  const { data, isLoading, refetch } = useMediaFiles()
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [deleteFile, setDeleteFile] = React.useState<MediaFile | null>(null)

  const files = data?.files ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media</h1>
        <p className="text-muted-foreground">
          Upload and manage your media files
        </p>
      </div>

      {/* Upload Area */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
        <MediaUploader onUploadComplete={() => refetch()} />
      </div>

      {/* Media Library */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Media Library</h2>
        <MediaGrid
          files={files}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDelete={setDeleteFile}
        />
      </div>

      {/* Delete Dialog */}
      <DeleteMediaDialog
        file={deleteFile}
        open={!!deleteFile}
        onOpenChange={(open) => {
          if (!open) setDeleteFile(null)
        }}
      />
    </div>
  )
}
