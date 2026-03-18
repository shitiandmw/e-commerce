import { io, Socket } from "socket.io-client"
import { getState, setState, addMessage, confirmMessage } from "./store"

let socket: Socket | null = null

function getSocketUrl(): string {
  const config = (window as any).__TIMECIGAR_CHAT_CONFIG__
  if (config?.socketUrl) return config.socketUrl
  const script = document.querySelector('script[src*="chat/widget"]') as HTMLScriptElement
  const host = script ? new URL(script.src).hostname : "localhost"
  const port = config?.socketPort || "9001"
  const protocol = location.protocol === "https:" ? "https:" : "http:"
  return `${protocol}//${host}:${port}`
}

export function connectSocket(conversationId: string) {
  if (socket?.connected) {
    socket.emit("chat:join", { conversation_id: conversationId })
    return
  }

  const state = getState()
  const auth: Record<string, string> = {}

  if (state.customerToken) {
    auth.role = "customer"
    auth.token = state.customerToken
  } else {
    auth.role = "visitor"
    auth.visitor_id = state.visitorId
  }

  socket = io(getSocketUrl(), {
    auth,
    transports: ["polling", "websocket"],
  })

  socket.on("connect", () => {
    setState({ connected: true })
    socket!.emit("chat:join", { conversation_id: conversationId })
  })

  socket.on("disconnect", () => {
    setState({ connected: false })
  })

  socket.on("chat:message", (msg) => {
    if (msg.sender_type === "agent" || msg.sender_type === "system") {
      const state = getState()
      if (!state.messages.some((m) => m.id === msg.id)) {
        addMessage(msg)
      }
    } else {
      // Our own message echoed back — replace temp with real
      confirmMessage(msg)
    }
  })
}

export function sendMessage(content: string) {
  const state = getState()
  if (!state.conversationId || !socket?.connected) return

  // Optimistic add
  const tempId = `temp_${Date.now()}`
  addMessage({
    id: tempId,
    conversation_id: state.conversationId,
    sender_type: state.customerToken ? "customer" : "visitor",
    sender_id: state.customerToken ? "me" : state.visitorId,
    content,
    message_type: "text",
    created_at: new Date().toISOString(),
  })

  socket.emit("chat:message", {
    conversation_id: state.conversationId,
    content,
    message_type: "text",
  })
}

export function emitTyping() {
  const state = getState()
  if (socket && state.conversationId) {
    socket.emit("chat:typing", { conversation_id: state.conversationId })
  }
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
  setState({ connected: false })
}
