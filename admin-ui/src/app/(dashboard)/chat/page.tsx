"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatPanel } from "@/components/chat/chat-panel"
import { useChatSocketContext } from "@/providers/chat-socket-provider"

export default function ChatPage() {
  const t = useTranslations("chat")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { connected, resetUnread, joinConversation, sendMessage, sendTyping } = useChatSocketContext()

  // Reset sidebar badge when entering chat page
  useEffect(() => { resetUnread() }, [])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    joinConversation(id)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
          <span className="text-muted-foreground">{connected ? t("connected") : t("disconnected")}</span>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ConversationList selectedId={selectedId} onSelect={handleSelect} />
        <ChatPanel
          conversationId={selectedId}
          connected={connected}
          onSendMessage={sendMessage}
          onTyping={sendTyping}
        />
      </div>
    </div>
  )
}
