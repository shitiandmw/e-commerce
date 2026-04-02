import { getState, subscribe, clearUnread, ChatMessage } from "./store"
import { sendMessage } from "./socket"

const MSG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

let root: ShadowRoot
let messagesEl: HTMLElement
let inputEl: HTMLTextAreaElement
let badgeEl: HTMLElement
let windowEl: HTMLElement

export function createUI(shadowRoot: ShadowRoot) {
  root = shadowRoot

  const container = document.createElement("div")
  container.className = "tc-chat-container"

  // Chat window
  windowEl = document.createElement("div")
  windowEl.className = "tc-chat-window hidden"
  windowEl.innerHTML = `
    <div class="tc-chat-header">
      <div>
        <div class="tc-chat-header-title">SHANGJIA</div>
        <div class="tc-chat-header-status">在线客服</div>
      </div>
      <button class="tc-chat-close">${CLOSE_ICON}</button>
    </div>
    <div class="tc-chat-messages"></div>
    <div class="tc-chat-input-area">
      <textarea class="tc-chat-input" placeholder="输入消息..." rows="1"></textarea>
      <button class="tc-chat-send">发送</button>
    </div>
  `

  // Toggle button
  const btn = document.createElement("button")
  btn.className = "tc-chat-btn"
  btn.innerHTML = MSG_ICON
  badgeEl = document.createElement("span")
  badgeEl.className = "tc-badge"
  btn.appendChild(badgeEl)

  container.appendChild(windowEl)
  container.appendChild(btn)
  shadowRoot.appendChild(container)

  // Get references
  messagesEl = windowEl.querySelector(".tc-chat-messages")!
  inputEl = windowEl.querySelector(".tc-chat-input")!
  const sendBtn = windowEl.querySelector(".tc-chat-send")!
  const closeBtn = windowEl.querySelector(".tc-chat-close")!

  // Event listeners
  btn.addEventListener("click", onToggle)
  closeBtn.addEventListener("click", onClose)
  sendBtn.addEventListener("click", onSend)
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  })

  // Subscribe to state changes
  subscribe(render)
}

function onToggle() {
  const state = getState()
  if (state.isOpen) {
    onClose()
  } else {
    // Dispatch custom event for the main app to handle
    const event = new CustomEvent("timecigar-chat:open")
    document.dispatchEvent(event)
  }
}

function onClose() {
  const event = new CustomEvent("timecigar-chat:close")
  document.dispatchEvent(event)
}

function onSend() {
  const state = getState()
  if (!state.connected) return
  const content = inputEl.value.trim()
  if (!content) return
  sendMessage(content)
  inputEl.value = ""
  inputEl.focus()
}

function render() {
  const state = getState()

  // Window visibility
  if (state.isOpen) {
    windowEl.classList.remove("hidden")
    clearUnread()
  } else {
    windowEl.classList.add("hidden")
  }

  // Badge
  badgeEl.textContent = state.unreadCount > 0 ? String(state.unreadCount) : ""

  // Connection status
  const statusEl = windowEl.querySelector(".tc-chat-header-status")!
  statusEl.textContent = state.connected ? "在线客服" : "未连接"
  ;(statusEl as HTMLElement).style.color = state.connected ? "" : "#ef4444"

  // Disable input when disconnected
  const sendBtn = windowEl.querySelector(".tc-chat-send") as HTMLButtonElement
  inputEl.disabled = !state.connected
  sendBtn.disabled = !state.connected
  inputEl.placeholder = state.connected ? "输入消息..." : "未连接，请稍候..."

  // Messages
  renderMessages(state.messages)
}

function renderMessages(messages: ChatMessage[]) {
  const wasAtBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 50

  messagesEl.innerHTML = ""

  if (messages.length === 0) {
    const empty = document.createElement("div")
    empty.className = "tc-empty"
    empty.textContent = "发送消息开始对话"
    messagesEl.appendChild(empty)
    return
  }

  for (const msg of messages) {
    const el = document.createElement("div")
    el.className = `tc-msg tc-msg-${msg.sender_type}`

    if (msg.sender_type === "agent") {
      const label = document.createElement("div")
      label.className = "tc-msg-label"
      label.textContent = "客服"
      el.appendChild(label)
    }

    const text = document.createElement("div")
    text.textContent = msg.content
    el.appendChild(text)

    messagesEl.appendChild(el)
  }

  if (wasAtBottom) {
    messagesEl.scrollTop = messagesEl.scrollHeight
  }
}
