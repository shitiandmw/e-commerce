"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  useConversation,
  useConversationMessages,
  useSendChatMessage,
  useUpdateConversation,
  ChatMessage,
} from "@/hooks/use-chat"
import {
  useDeleteMedia,
  useUploadMedia,
  type MediaFile,
} from "@/hooks/use-media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ImageOff, ImagePlus, Loader2, Send, X, RotateCcw, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const CHAT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024
type ChatImageMimeType = (typeof CHAT_IMAGE_TYPES)[number]

const CHAT_IMAGE_EXTENSIONS: Record<ChatImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

interface PendingImage {
  file: File
  previewUrl: string
  status: "uploading" | "ready" | "error"
  uploadedFile?: MediaFile
}

interface ChatPanelProps {
  conversationId: string | null
  onTyping: (conversationId: string) => void
}

export function ChatPanel({ conversationId, onTyping }: ChatPanelProps) {
  const t = useTranslations("chat")
  const [input, setInput] = useState("")
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingImageRef = useRef<PendingImage | null>(null)
  const uploadAttemptRef = useRef(0)
  const { data: convData } = useConversation(conversationId)
  const { data: msgData } = useConversationMessages(conversationId)
  const updateConv = useUpdateConversation(conversationId || "")
  const sendMessage = useSendChatMessage(conversationId || "")
  const uploadMedia = useUploadMedia()
  const deleteMedia = useDeleteMedia()

  const conversation = convData?.conversation
  const messages = msgData?.chat_messages ?? []
  const isImageUploading = pendingImage?.status === "uploading"
  const isComposerDisabled = conversation?.status === "closed" || sendMessage.isPending
  const canSend = Boolean(
    (input.trim() || pendingImage?.status === "ready") &&
    !isImageUploading &&
    pendingImage?.status !== "error"
  )

  const storePendingImage = (image: PendingImage | null) => {
    pendingImageRef.current = image
    setPendingImage(image)
  }

  const deleteUploadedFile = (fileId: string) => {
    deleteMedia.mutate(fileId)
  }

  const discardPendingImage = (deleteUpload = true) => {
    uploadAttemptRef.current += 1
    const image = pendingImageRef.current
    if (!image) return

    if (deleteUpload && image.uploadedFile?.id) {
      deleteUploadedFile(image.uploadedFile.id)
    }
    URL.revokeObjectURL(image.previewUrl)
    storePendingImage(null)
    setIsImagePreviewOpen(false)
  }

  const uploadPendingImage = async (file: File, previewUrl: string) => {
    const attempt = ++uploadAttemptRef.current
    const uploadingImage: PendingImage = {
      file,
      previewUrl,
      status: "uploading",
    }
    storePendingImage(uploadingImage)

    try {
      const upload = await uploadMedia.mutateAsync([file])
      const uploadedFile = upload.files?.[0]
      if (!uploadedFile?.id || !uploadedFile.url) {
        throw new Error("Upload did not return a file URL")
      }

      if (
        attempt !== uploadAttemptRef.current ||
        pendingImageRef.current?.previewUrl !== previewUrl
      ) {
        deleteUploadedFile(uploadedFile.id)
        return
      }

      storePendingImage({
        file,
        previewUrl,
        status: "ready",
        uploadedFile,
      })
    } catch {
      if (
        attempt !== uploadAttemptRef.current ||
        pendingImageRef.current?.previewUrl !== previewUrl
      ) {
        return
      }

      storePendingImage({ file, previewUrl, status: "error" })
      toast.error(t("uploadFailed"))
    }
  }

  const stageImage = (file: File) => {
    if (!conversationId || isComposerDisabled) return

    const mimeType = file.type as ChatImageMimeType
    if (!CHAT_IMAGE_TYPES.includes(mimeType)) {
      toast.error(t("invalidImageType"))
      return
    }
    if (file.size > CHAT_IMAGE_MAX_BYTES) {
      toast.error(t("imageTooLarge"))
      return
    }

    discardPendingImage()
    const stagedFile = file.name
      ? file
      : new File(
          [file],
          `pasted-image.${CHAT_IMAGE_EXTENSIONS[mimeType]}`,
          { type: mimeType }
        )
    const previewUrl = URL.createObjectURL(stagedFile)
    void uploadPendingImage(stagedFile, previewUrl)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Mark conversation as read when selected
  useEffect(() => {
    if (conversationId && conversation && conversation.unread_count > 0) {
      updateConv.mutate({ unread_count: 0 })
    }
  }, [conversationId, conversation?.unread_count])

  useEffect(() => {
    discardPendingImage()
    setIsDraggingImage(false)
  }, [conversationId])

  useEffect(() => {
    return () => {
      uploadAttemptRef.current += 1
      const image = pendingImageRef.current
      if (!image) return

      if (image.uploadedFile?.id) {
        deleteUploadedFile(image.uploadedFile.id)
      }
      URL.revokeObjectURL(image.previewUrl)
      pendingImageRef.current = null
    }
  }, [])

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-10 w-10 opacity-30" />
          <p className="text-sm">{t("noConversation")}</p>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    const text = input.trim()
    const image = pendingImageRef.current
    if (
      (!text && !image) ||
      !conversationId ||
      isComposerDisabled ||
      (image && image.status !== "ready")
    ) {
      return
    }

    try {
      if (image?.uploadedFile) {
        await sendMessage.mutateAsync({
          message_type: "image",
          content: image.uploadedFile.url,
          metadata: {
            file_id: image.uploadedFile.id,
            file_name: image.file.name,
            mime_type: image.file.type as ChatImageMimeType,
            size: image.file.size,
          },
        })
        discardPendingImage(false)
      }

      if (text) {
        await sendMessage.mutateAsync({ message_type: "text", content: text })
        setInput("")
      }
    } catch {
      toast.error(t("sendFailed"))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (conversationId) onTyping(conversationId)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find(
      (item) => item.kind === "file" && item.type.startsWith("image/")
    )
    const file = imageItem?.getAsFile()
    if (!file) return

    event.preventDefault()
    stageImage(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingImage(false)

    const file = Array.from(event.dataTransfer.files).find((item) =>
      item.type.startsWith("image/")
    )
    if (file) {
      stageImage(file)
    }
  }

  const toggleStatus = () => {
    if (!conversation) return
    updateConv.mutate({
      status: conversation.status === "open" ? "closed" : "open",
    })
  }

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) stageImage(file)
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {conversation?.customer_id ? t("customer") : t("visitor")}
          </span>
          <Badge variant={conversation?.status === "open" ? "default" : "secondary"} className="text-xs">
            {conversation?.status === "open" ? t("statusOpen") : t("statusClosed")}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleStatus}>
          {conversation?.status === "open" ? (
            <><X className="mr-1 h-3.5 w-3.5" />{t("close")}</>
          ) : (
            <><RotateCcw className="mr-1 h-3.5 w-3.5" />{t("reopen")}</>
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onImageLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div
          className={cn(
            "rounded-md transition-shadow",
            isDraggingImage && "ring-2 ring-primary ring-offset-2"
          )}
          onDragEnter={(event) => {
            if (
              Array.from(event.dataTransfer.items).some(
                (item) => item.kind === "file"
              )
            ) {
              event.preventDefault()
              setIsDraggingImage(true)
            }
          }}
          onDragOver={(event) => {
            if (
              Array.from(event.dataTransfer.items).some(
                (item) => item.kind === "file"
              )
            ) {
              event.preventDefault()
              event.dataTransfer.dropEffect = "copy"
            }
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsDraggingImage(false)
            }
          }}
          onDrop={handleDrop}
        >
          {pendingImage && (
            <div className="mb-3 flex min-w-0 items-center gap-3 rounded-md border bg-muted/30 p-2">
              <button
                type="button"
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded border bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => setIsImagePreviewOpen(true)}
                title={t("previewImage")}
                aria-label={t("previewImage")}
              >
                <img
                  src={pendingImage.previewUrl}
                  alt={pendingImage.file.name || t("pendingImage")}
                  className="h-full w-full object-cover"
                />
                {pendingImage.status === "uploading" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {pendingImage.file.name || t("pendingImage")}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs text-muted-foreground",
                    pendingImage.status === "error" && "text-destructive"
                  )}
                >
                  {pendingImage.status === "uploading"
                    ? t("uploadingImage")
                    : pendingImage.status === "ready"
                      ? t("readyToSend")
                      : t("imageUploadError")}
                </p>
                {pendingImage.status === "error" && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() =>
                      void uploadPendingImage(
                        pendingImage.file,
                        pendingImage.previewUrl
                      )
                    }
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    {t("retryUpload")}
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => discardPendingImage()}
                disabled={sendMessage.isPending}
                title={t("removeImage")}
                aria-label={t("removeImage")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={CHAT_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={handleImageSelected}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={t("uploadImage")}
              aria-label={t("uploadImage")}
              onClick={() => fileInputRef.current?.click()}
              disabled={isComposerDisabled || isImageUploading}
            >
              {isImageUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={t("typeMessage")}
              disabled={isComposerDisabled}
            />
            <Button
              onClick={() => void handleSend()}
              disabled={!canSend || isComposerDisabled}
              size="icon"
              title={t("send")}
              aria-label={t("send")}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent
          className="max-w-4xl border-0 bg-black p-2 text-white shadow-none [&>button]:bg-black/70 [&>button]:p-1 [&>button]:text-white"
          onClose={() => setIsImagePreviewOpen(false)}
        >
          <DialogTitle className="sr-only">{t("imagePreview")}</DialogTitle>
          {pendingImage && (
            <img
              src={pendingImage.previewUrl}
              alt={pendingImage.file.name || t("pendingImage")}
              className="max-h-[85vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MessageBubble({
  message,
  onImageLoad,
}: {
  message: ChatMessage
  onImageLoad: () => void
}) {
  const t = useTranslations("chat")
  const [imageFailed, setImageFailed] = useState(false)
  const isAgent = message.sender_type === "agent"
  const isSystem = message.sender_type === "system"
  const isImage = message.message_type === "image"
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-muted-foreground">{message.content}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2",
          isAgent ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium opacity-70">
            {message.sender_type === "agent"
              ? t("agent")
              : message.sender_type === "customer"
                ? t("customer")
                : t("visitor")}
          </span>
        </div>
        {isImage ? (
          imageFailed ? (
            <div className="flex min-h-24 min-w-48 items-center justify-center gap-2 rounded border border-current/20 px-4 text-sm opacity-70">
              <ImageOff className="h-4 w-4" />
              <span>{t("imageLoadFailed")}</span>
            </div>
          ) : (
            <a href={message.content} target="_blank" rel="noopener noreferrer">
              <img
                src={message.content}
                alt={typeof message.metadata?.file_name === "string" ? message.metadata.file_name : t("imageMessage")}
                className="max-h-72 w-auto max-w-full rounded object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={onImageLoad}
                onError={() => setImageFailed(true)}
              />
            </a>
          )
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <p className={cn("mt-1 text-right text-xs", isAgent ? "opacity-60" : "text-muted-foreground")}>
          {time}
        </p>
      </div>
    </div>
  )
}
