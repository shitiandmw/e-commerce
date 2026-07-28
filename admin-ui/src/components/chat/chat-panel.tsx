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
import { useUploadMedia, type UploadResponse } from "@/hooks/use-media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ImageOff, ImagePlus, Loader2, Send, X, RotateCcw, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const CHAT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024

interface ChatPanelProps {
  conversationId: string | null
  onTyping: (conversationId: string) => void
}

export function ChatPanel({ conversationId, onTyping }: ChatPanelProps) {
  const t = useTranslations("chat")
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: convData } = useConversation(conversationId)
  const { data: msgData } = useConversationMessages(conversationId)
  const updateConv = useUpdateConversation(conversationId || "")
  const sendMessage = useSendChatMessage(conversationId || "")
  const uploadMedia = useUploadMedia()

  const conversation = convData?.conversation
  const messages = msgData?.chat_messages ?? []
  const isBusy = sendMessage.isPending || uploadMedia.isPending

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Mark conversation as read when selected
  useEffect(() => {
    if (conversationId && conversation && conversation.unread_count > 0) {
      updateConv.mutate({ unread_count: 0 })
    }
  }, [conversationId, conversation?.unread_count])

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
    if (!text || !conversationId) return
    try {
      await sendMessage.mutateAsync({ message_type: "text", content: text })
      setInput("")
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

  const toggleStatus = () => {
    if (!conversation) return
    updateConv.mutate({
      status: conversation.status === "open" ? "closed" : "open",
    })
  }

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !conversationId) return

    if (!CHAT_IMAGE_TYPES.includes(file.type as (typeof CHAT_IMAGE_TYPES)[number])) {
      toast.error(t("invalidImageType"))
      return
    }
    if (file.size > CHAT_IMAGE_MAX_BYTES) {
      toast.error(t("imageTooLarge"))
      return
    }

    let upload: UploadResponse
    try {
      upload = await uploadMedia.mutateAsync([file])
    } catch {
      toast.error(t("uploadFailed"))
      return
    }

    try {
      const uploadedFile = upload.files?.[0]
      if (!uploadedFile?.url) throw new Error("Upload did not return a file URL")

      await sendMessage.mutateAsync({
        message_type: "image",
        content: uploadedFile.url,
        metadata: {
          file_id: uploadedFile.id,
          file_name: file.name,
          mime_type: file.type as (typeof CHAT_IMAGE_TYPES)[number],
          size: file.size,
        },
      })
    } catch {
      toast.error(t("sendFailed"))
    }
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
            disabled={conversation?.status === "closed" || isBusy}
          >
            {uploadMedia.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t("typeMessage")}
            disabled={conversation?.status === "closed" || isBusy}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!input.trim() || conversation?.status === "closed" || isBusy}
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
