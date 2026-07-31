"use client"

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetch } from "@/lib/admin-api"
import { getNextConversationOffset } from "@/lib/chat-conversations"

// ─── Types ───────────────────────────────────────────────

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: "customer" | "visitor" | "agent" | "system"
  sender_id: string
  content: string
  message_type: "text" | "image" | "system"
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

export type SendChatMessageInput =
  | {
      message_type?: "text"
      content: string
    }
  | {
      message_type: "image"
      content: string
      metadata: {
        file_id: string
        file_name: string
        mime_type: "image/jpeg" | "image/png" | "image/webp"
        size: number
      }
    }

// ─── Data Hooks ──────────────────────────────────────────

export function useConversations(params: { limit?: number; status?: string; q?: string } = {}) {
  const { limit = 50, status, q } = params
  return useInfiniteQuery<ConversationsResponse>({
    queryKey: ["conversations", { limit, status, q }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const query: Record<string, string> = { offset: String(pageParam), limit: String(limit) }
      if (status) query.status = status
      if (q) query.q = q
      return adminFetch<ConversationsResponse>("/admin/chat/conversations", { params: query })
    },
    getNextPageParam: getNextConversationOffset,
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

export function useSendChatMessage(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendChatMessageInput) =>
      adminFetch<{ message: ChatMessage }>(`/admin/chat/conversations/${id}/messages`, {
        method: "POST",
        body: data,
      }),
    onSuccess: ({ message }) => {
      queryClient.setQueriesData<MessagesResponse>(
        { queryKey: ["conversation-messages", id] },
        (old) => {
          if (!old || old.chat_messages.some((item) => item.id === message.id)) return old
          return {
            ...old,
            chat_messages: [...old.chat_messages, message],
            count: old.count + 1,
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
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
