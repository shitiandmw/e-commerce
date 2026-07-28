import {
  getState,
  setConversationToken,
  setCustomerToken,
  ChatMessage,
} from "./store"

const BASE_URL = getBaseUrl()
const PUBLISHABLE_KEY = getPublishableKey()

function getBaseUrl(): string {
  const script = document.querySelector('script[src*="chat/widget"]') as HTMLScriptElement
  if (script?.src) {
    const url = new URL(script.src)
    return url.origin
  }
  return "http://localhost:9000"
}

function getPublishableKey(): string {
  // First try injected config from widget route
  const config = (window as any).__TIMECIGAR_CHAT_CONFIG__
  if (config?.publishableKey) return config.publishableKey
  // Fallback to script tag data attribute
  const script = document.querySelector('script[src*="chat/widget"]') as HTMLScriptElement
  return script?.dataset?.publishableKey || ""
}

function storeHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY
  }
  const state = getState()
  if (state.customerToken) {
    headers["Authorization"] = `Bearer ${state.customerToken}`
  } else if (state.conversationToken) {
    headers["x-chat-conversation-token"] = state.conversationToken
  }
  return headers
}

type ConversationCredentials = {
  id: string
  conversationToken: string | null
}

export async function createConversation(
  retryWithoutCredentials = true
): Promise<ConversationCredentials> {
  const state = getState()
  const res = await fetch(`${BASE_URL}/store/chat/conversations`, {
    method: "POST",
    headers: storeHeaders(),
    body: JSON.stringify({
      visitor_id: state.visitorId,
      conversation_token: state.customerToken
        ? undefined
        : state.conversationToken || undefined,
    }),
  })

  if (res.status === 401 && retryWithoutCredentials) {
    const hasInvalidCredentials = Boolean(
      state.customerToken || state.conversationToken
    )

    if (state.customerToken) {
      setCustomerToken(null)
      window.dispatchEvent(new Event("auth-change"))
    }
    if (state.conversationToken) {
      setConversationToken(null)
    }

    if (hasInvalidCredentials) {
      return createConversation(false)
    }
  }
  if (!res.ok) throw new Error(`Create conversation failed: ${res.status}`)
  const data = await res.json()
  return {
    id: data.conversation.id,
    conversationToken: data.conversation_token || null,
  }
}

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(
    `${BASE_URL}/store/chat/conversations/${conversationId}/messages?limit=50&offset=0`,
    { headers: storeHeaders() }
  )
  if (!res.ok) throw new Error(`Load messages failed: ${res.status}`)
  const data = await res.json()
  return data.chat_messages || []
}
