export type ChatMessage = {
  id: string
  conversation_id: string
  sender_type: "customer" | "visitor" | "agent" | "system"
  sender_id: string
  content: string
  message_type: string
  created_at: string
}

type Listener = () => void

export interface ChatState {
  isOpen: boolean
  conversationId: string | null
  messages: ChatMessage[]
  connected: boolean
  loading: boolean
  unreadCount: number
  visitorId: string
  customerToken: string | null
}

const VISITOR_ID_KEY = "timecigar_chat_visitor_id"

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}

let state: ChatState = {
  isOpen: false,
  conversationId: null,
  messages: [],
  connected: false,
  loading: false,
  unreadCount: 0,
  visitorId: getOrCreateVisitorId(),
  customerToken: null,
}

const listeners: Set<Listener> = new Set()

export function getState(): ChatState {
  return state
}

export function setState(partial: Partial<ChatState>) {
  state = { ...state, ...partial }
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function addMessage(msg: ChatMessage) {
  setState({
    messages: [...state.messages, msg],
    unreadCount: state.isOpen ? state.unreadCount : state.unreadCount + 1,
  })
}

export function confirmMessage(msg: ChatMessage) {
  // Replace the first temp message with matching content, or append if no match
  const idx = state.messages.findIndex(
    (m) => m.id.startsWith("temp_") && m.content === msg.content
  )
  if (idx >= 0) {
    const updated = [...state.messages]
    updated[idx] = msg
    setState({ messages: updated })
  } else if (!state.messages.some((m) => m.id === msg.id)) {
    addMessage(msg)
  }
}

export function clearUnread() {
  if (state.unreadCount === 0) return
  setState({ unreadCount: 0 })
}
