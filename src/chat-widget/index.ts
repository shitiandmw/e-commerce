import { getStyles } from "./styles"
import { createUI } from "./ui"
import {
  getState,
  setConversationToken,
  setCustomerToken,
  setState,
} from "./store"
import { createConversation, loadMessages } from "./api"
import { connectSocket, disconnectSocket } from "./socket"

function init() {
  // Create shadow DOM host
  const host = document.createElement("div")
  host.id = "timecigar-chat-widget"
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: "open" })

  // Inject styles
  const style = document.createElement("style")
  style.textContent = getStyles()
  shadow.appendChild(style)

  // Create UI
  createUI(shadow)

  // Handle open event
  document.addEventListener("timecigar-chat:open", async () => {
    setState({ isOpen: true })

    const state = getState()
    if (!state.conversationId) {
      setState({ loading: true, connectionFailed: false })
      try {
        const credentials = await createConversation()
        setConversationToken(credentials.conversationToken)
        setState({ conversationId: credentials.id })

        const messages = await loadMessages(credentials.id)
        setState({ messages })

        connectSocket(credentials.id)
      } catch (err) {
        setState({ connectionFailed: true })
        console.error("[TimeCigarChat] Failed to initialize:", err)
      } finally {
        setState({ loading: false })
      }
    }
  })

  // Handle close event
  document.addEventListener("timecigar-chat:close", () => {
    setState({ isOpen: false })
  })

  // Expose global API
  ;(window as any).TimeCigarChat = {
    open() {
      document.dispatchEvent(new CustomEvent("timecigar-chat:open"))
    },
    close() {
      document.dispatchEvent(new CustomEvent("timecigar-chat:close"))
    },
    setCustomerToken(token: string) {
      const state = getState()
      if (state.customerToken === token) return

      disconnectSocket()
      setConversationToken(null)
      setCustomerToken(token)
      setState({
        conversationId: null,
        messages: [],
        connectionFailed: false,
      })
      if (state.isOpen) {
        queueMicrotask(() => document.dispatchEvent(new CustomEvent("timecigar-chat:open")))
      }
    },
    clearCustomerToken() {
      const state = getState()
      disconnectSocket()
      setConversationToken(null)
      setCustomerToken(null)
      setState({
        conversationId: null,
        messages: [],
        connectionFailed: false,
      })
      if (state.isOpen) {
        queueMicrotask(() => document.dispatchEvent(new CustomEvent("timecigar-chat:open")))
      }
    },
  }
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
