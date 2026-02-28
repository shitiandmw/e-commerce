"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getToken } from "@/lib/auth"
import { io, Socket } from "socket.io-client"
import type { ChatMessage } from "@/hooks/use-chat"

interface ChatSocketContextValue {
  connected: boolean
  totalUnread: number
  resetUnread: () => void
  joinConversation: (id: string) => void
  sendMessage: (conversationId: string, content: string) => void
  sendTyping: (conversationId: string) => void
}

const ChatSocketContext = createContext<ChatSocketContextValue>({
  connected: false,
  totalUnread: 0,
  resetUnread: () => {},
  joinConversation: () => {},
  sendMessage: () => {},
  sendTyping: () => {},
})

export const useChatSocketContext = () => useContext(ChatSocketContext)

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9001"

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const queryClient = useQueryClient()

  // Fetch initial unread count
  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { role: "agent", token },
      transports: ["websocket", "polling"],
    })
    socketRef.current = socket

    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))

    // Real-time message updates for open conversation panels
    socket.on("chat:message", (msg: ChatMessage) => {
      queryClient.setQueryData(
        ["conversation-messages", msg.conversation_id, { offset: 0, limit: 50 }],
        (old: any) => {
          if (!old) return old
          if (old.chat_messages.some((m: ChatMessage) => m.id === msg.id)) return old
          return { ...old, chat_messages: [...old.chat_messages, msg], count: old.count + 1 }
        }
      )
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    // New conversation or activity from visitors/customers
    socket.on("chat:conversation:activity", (data: { conversation_id: string; last_message_preview: string }) => {
      setTotalUnread((prev) => prev + 1)
      queryClient.invalidateQueries({ queryKey: ["conversations"] })

      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("TIMECIGAR 客服", {
          body: data.last_message_preview || "新消息",
          icon: "/favicon.ico",
        })
      }
    })

    socket.on("chat:conversation:new", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    socket.on("chat:conversation:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    // Request notification permission
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [queryClient])

  const resetUnread = useCallback(() => setTotalUnread(0), [])

  const joinConversation = useCallback((id: string) => {
    socketRef.current?.emit("chat:join", { conversation_id: id })
  }, [])

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit("chat:message", { conversation_id: conversationId, content })
  }, [])

  const sendTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("chat:typing", { conversation_id: conversationId })
  }, [])

  return (
    <ChatSocketContext.Provider value={{ connected, totalUnread, resetUnread, joinConversation, sendMessage, sendTyping }}>
      {children}
    </ChatSocketContext.Provider>
  )
}
