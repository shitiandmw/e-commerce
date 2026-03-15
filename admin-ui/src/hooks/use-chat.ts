"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"
import { getToken } from "@/lib/auth"
import { io, Socket } from "socket.io-client"

// ─── Types ───────────────────────────────────────────────

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: "customer" | "visitor" | "agent" | "system"
  sender_id: string
  content: string
  message_type: string
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface Conversation {
  id: string
  visitor_id: string | null
  customer_id: string | null
  assigned_agent_id: string | null
  status: "open" | "closed"
  last_message_preview: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
  updated_at: string
  messages?: ChatMessage[]
}

interface ConversationsResponse {
  conversations: Conversation[]
  count: number
  offset: number
  limit: number
}

interface MessagesResponse {
  chat_messages: ChatMessage[]
  count: number
  offset: number
  limit: number
}

// ─── Data Hooks ──────────────────────────────────────────

export function useConversations(params: { offset?: number; limit?: number; status?: string; q?: string } = {}) {
  const { offset = 0, limit = 50, status, q } = params
  return useQuery<ConversationsResponse>({
    queryKey: ["conversations", { offset, limit, status, q }],
    queryFn: () => {
      const query: Record<string, string> = { offset: String(offset), limit: String(limit) }
      if (status) query.status = status
      if (q) query.q = q
      return adminFetch<ConversationsResponse>("/admin/chat/conversations", { params: query })
    },
    refetchInterval: 10000,
  })
}

export function useConversation(id: string | null) {
  return useQuery<{ conversation: Conversation }>({
    queryKey: ["conversation", id],
    queryFn: () => adminFetch<{ conversation: Conversation }>(`/admin/chat/conversations/${id}`),
    enabled: !!id,
  })
}

export function useConversationMessages(id: string | null, params: { offset?: number; limit?: number } = {}) {
  const { offset = 0, limit = 50 } = params
  return useQuery<MessagesResponse>({
    queryKey: ["conversation-messages", id, { offset, limit }],
    queryFn: () =>
      adminFetch<MessagesResponse>(`/admin/chat/conversations/${id}/messages`, {
        params: { offset: String(offset), limit: String(limit) },
      }),
    enabled: !!id,
  })
}

export function useUpdateConversation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { status?: "open" | "closed"; assigned_agent_id?: string | null; unread_count?: number }) =>
      adminFetch<{ conversation: Conversation }>(`/admin/chat/conversations/${id}`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      queryClient.invalidateQueries({ queryKey: ["conversation", id] })
    },
  })
}

export function useChatSettings() {
  return useQuery<{
    chat_settings: Array<{
      id: string
      welcome_message?: string | null
      offline_message?: string | null
      business_hours?: Record<string, unknown> | null
      ai_enabled?: boolean
      ai_provider?: "openai" | "anthropic" | null
      ai_api_url?: string | null
      ai_api_key?: string | null
      ai_model?: string | null
      ai_system_prompt?: string | null
      ai_debounce_seconds?: number
    }>
  }>({
    queryKey: ["chat-settings"],
    queryFn: () => adminFetch("/admin/chat/settings"),
  })
}

export function useUpdateChatSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      welcome_message?: string | null
      offline_message?: string | null
      business_hours?: Record<string, unknown> | null
      ai_enabled?: boolean
      ai_provider?: "openai" | "anthropic"
      ai_api_url?: string
      ai_api_key?: string
      ai_model?: string
      ai_system_prompt?: string
      ai_debounce_seconds?: number
    }) =>
      adminFetch("/admin/chat/settings", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-settings"] })
    },
  })
}

// ─── Socket.io Hook ──────────────────────────────────────

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9001"

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const queryClient = useQueryClient()

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

    socket.on("chat:message", (msg: ChatMessage) => {
      queryClient.setQueryData<MessagesResponse>(
        ["conversation-messages", msg.conversation_id, { offset: 0, limit: 50 }],
        (old) => {
          if (!old) return old
          if (old.chat_messages.some((m) => m.id === msg.id)) return old
          return { ...old, chat_messages: [...old.chat_messages, msg], count: old.count + 1 }
        }
      )
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    socket.on("chat:conversation:new", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    socket.on("chat:conversation:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [queryClient])

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("chat:join", { conversation_id: conversationId })
  }, [])

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit("chat:message", { conversation_id: conversationId, content })
  }, [])

  const sendTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("chat:typing", { conversation_id: conversationId })
  }, [])

  return { socket: socketRef, connected, joinConversation, sendMessage, sendTyping }
}
