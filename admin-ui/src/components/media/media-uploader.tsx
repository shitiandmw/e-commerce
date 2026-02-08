"use client"

import * as React from "react"
import { useUploadMedia } from "@/hooks/use-media"
import { cn } from "@/lib/utils"
import { Upload, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadingFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

interface MediaUploaderProps {
  onUploadComplete?: () => void
  compact?: boolean
}

export function MediaUploader({ onUploadComplete, compact }: MediaUploaderProps) {
  const [dragOver, setDragOver] = React.useState(false)
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uploadMedia = useUploadMedia()

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      const newUploading = fileArray.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }))

      setUploadingFiles((prev) => [...prev, ...newUploading])

      try {
        await uploadMedia.mutateAsync(fileArray)
        setUploadingFiles((prev) =>
          prev.map((f) =>
            newUploading.some((nf) => nf.file === f.file)
              ? { ...f, status: "done" as const, progress: 100 }
              : f
          )
        )
        onUploadComplete?.()

        // Clear completed uploads after a delay
        setTimeout(() => {
          setUploadingFiles((prev) =>
            prev.filter((f) => f.status !== "done")
          )
        }, 2000)
      } catch (err) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            newUploading.some((nf) => nf.file === f.file)
              ? {
                  ...f,
                  status: "error" as const,
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : f
          )
        )
      }
    },
    [uploadMedia, onUploadComplete]
  )

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          compact ? "p-4" : "p-8",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files)
              e.target.value = ""
            }
          }}
        />
        <Upload
          className={cn(
            "text-muted-foreground",
            compact ? "h-6 w-6 mb-2" : "h-10 w-10 mb-3"
          )}
        />
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          {dragOver ? "Drop files here" : "Click or drag files to upload"}
        </p>
        {!compact && (
          <p className="mt-1 text-xs text-muted-foreground">
            Supports images, videos, and PDFs
          </p>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uf, idx) => (
            <div
              key={`${uf.file.name}-${idx}`}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              {uf.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
              )}
              {uf.status === "done" && (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
              {uf.status === "error" && (
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uf.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uf.file.size)}
                  {uf.error && (
                    <span className="text-destructive ml-2">{uf.error}</span>
                  )}
                </p>
              </div>
              {(uf.status === "error" || uf.status === "done") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => removeUploadingFile(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
