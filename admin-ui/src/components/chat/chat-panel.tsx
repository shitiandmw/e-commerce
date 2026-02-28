"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useConversation, useConversationMessages, useUpdateConversation, ChatMessage } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, X, RotateCcw, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  conversationId: string | null
  connected: boolean
  onSendMessage: (conversationId: string, content: string) => void
  onTyping: (conversationId: string) => void
}

export function ChatPanel({ conversationId, connected, onSendMessage, onTyping }: ChatPanelProps) {
  const t = useTranslations("chat")
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: convData } = useConversation(conversationId)
  const { data: msgData } = useConversationMessages(conversationId)
  const updateConv = useUpdateConversation(conversationId || "")

  const conversation = convData?.conversation
  const messages = msgData?.chat_messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Mark conversation as read when selected
  useEffect(() => {
    if (conversationId && conversation && conversation.unread_count > 0) {
      updateConv.mutate({ unread_count: 0 })
    }
  }, [conversationId])

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

  const handleSend = () => {
    const text = input.trim()
    if (!text || !conversationId) return
    onSendMessage(conversationId, text)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={connected ? t("typeMessage") : t("disconnected")}
            disabled={conversation?.status === "closed" || !connected}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || conversation?.status === "closed" || !connected}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const t = useTranslations("chat")
  const isAgent = message.sender_type === "agent"
  const isSystem = message.sender_type === "system"
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
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn("mt-1 text-right text-xs", isAgent ? "opacity-60" : "text-muted-foreground")}>
          {time}
        </p>
      </div>
    </div>
  )
}
