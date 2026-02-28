import { getStyles } from "./styles"
import { createUI } from "./ui"
import { getState, setState } from "./store"
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
      setState({ loading: true })
      try {
        const conversationId = await createConversation()
        setState({ conversationId })

        const messages = await loadMessages(conversationId)
        setState({ messages })

        connectSocket(conversationId)
      } catch (err) {
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
      setState({ customerToken: token })
      // Reconnect with new auth if already connected
      const state = getState()
      if (state.conversationId) {
        disconnectSocket()
        connectSocket(state.conversationId)
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
