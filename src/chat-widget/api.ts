import { getState, ChatMessage } from "./store"

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
  }
  return headers
}

export async function createConversation(): Promise<string> {
  const state = getState()
  const res = await fetch(`${BASE_URL}/store/chat/conversations`, {
    method: "POST",
    headers: storeHeaders(),
    body: JSON.stringify({ visitor_id: state.visitorId }),
  })
  if (!res.ok) throw new Error(`Create conversation failed: ${res.status}`)
  const data = await res.json()
  return data.conversation.id
}

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(
    `${BASE_URL}/store/chat/conversations/${conversationId}/messages?limit=50&offset=0`,
    { headers: storeHeaders() }
  )
  const data = await res.json()
  return data.chat_messages || []
}
