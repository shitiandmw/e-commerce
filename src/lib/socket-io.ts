import { Server as SocketIOServer } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import Redis from "ioredis"
import http from "http"
import { MedusaContainer } from "@medusajs/framework/types"
import { sendMessageWorkflow } from "../workflows/chat/send-message"
import { generateAIResponse } from "./ai-service"
import { CHAT_MODULE } from "../modules/chat"
import ChatModuleService from "../modules/chat/service"
import {
  canAccessConversation,
  ChatIdentity,
  verifyMedusaChatActorToken,
  verifyVisitorConversationToken,
} from "./chat-auth"
import { CHAT_TEXT_MAX_LENGTH, buildChatMessagePreview } from "./chat-message"

let io: SocketIOServer | null = null
let containerRef: MedusaContainer | null = null
const aiDebounceTimers = new Map<string, NodeJS.Timeout>()

export function getSocketIO(): SocketIOServer | null {
  return io
}

export function setContainer(container: MedusaContainer): void {
  containerRef = container
}

export function broadcastChatMessage(
  conversationId: string,
  message: {
    id: string
    sender_type: string
    sender_id: string
    content: string
    message_type: string
    metadata?: Record<string, unknown> | null
    created_at: Date | string
  }
): void {
  io?.to(`conversation:${conversationId}`).emit("chat:message", {
    id: message.id,
    conversation_id: conversationId,
    sender_type: message.sender_type,
    sender_id: message.sender_id,
    content: message.content,
    message_type: message.message_type,
    metadata: message.metadata || null,
    created_at: message.created_at,
  })
}

export function broadcastConversationActivity(
  conversationId: string,
  input: {
    content: string
    message_type?: "text" | "image" | "system"
    sender_type: string
  }
): void {
  io?.to("agents").emit("chat:conversation:activity", {
    conversation_id: conversationId,
    last_message_preview: buildChatMessagePreview(input),
    sender_type: input.sender_type,
  })
}

async function getAuthorizedConversation(
  conversationId: string,
  identity: ChatIdentity
): Promise<any | null> {
  if (!containerRef) return null

  try {
    const chatService: ChatModuleService = containerRef.resolve(CHAT_MODULE)
    const conversation = await chatService.retrieveConversation(conversationId)
    return canAccessConversation(identity, conversation) ? conversation : null
  } catch {
    return null
  }
}

export function initSocketIO(): SocketIOServer {
  if (io) return io

  const port = parseInt(process.env.SOCKET_PORT || "9001", 10)
  const storeCors = process.env.STORE_CORS || ""
  const adminCors = process.env.ADMIN_CORS || ""
  const origins = [...storeCors.split(","), ...adminCors.split(",")].filter(Boolean)

  const httpServer = http.createServer()

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: origins.length > 0 ? origins : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Redis adapter
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    try {
      const pubClient = new Redis(redisUrl)
      const subClient = pubClient.duplicate()
      io.adapter(createAdapter(pubClient, subClient))
    } catch (err) {
      console.warn("[socket.io] Redis adapter failed, using in-memory:", err)
    }
  }

  // Authentication middleware
  io.use((socket, next) => {
    const { token, conversation_token } = socket.handshake.auth as {
      token?: string
      conversation_token?: string
    }

    const identity = token
      ? verifyMedusaChatActorToken(token)
      : conversation_token
        ? verifyVisitorConversationToken(conversation_token)
        : null

    if (!identity) {
      return next(new Error("Invalid chat credentials"))
    }

    socket.data.identity = identity
    socket.data.authorizedConversations = new Set<string>()
    return next()
  })

  // Connection handler
  io.on("connection", (socket) => {
    const identity = socket.data.identity as ChatIdentity
    const authorizedConversations = socket.data.authorizedConversations as Set<string>
    console.log(`[socket.io] ${identity.role} connected: ${identity.id}`)

    if (identity.role === "agent") {
      socket.join("agents")
    }

    socket.on("chat:join", async ({ conversation_id } = {}, acknowledge) => {
      if (typeof conversation_id !== "string") {
        acknowledge?.({ ok: false, error: "Invalid conversation" })
        return
      }

      const conversation = await getAuthorizedConversation(conversation_id, identity)
      if (!conversation) {
        acknowledge?.({ ok: false, error: "Conversation not found" })
        return
      }

      authorizedConversations.add(conversation_id)
      await socket.join(`conversation:${conversation_id}`)
      acknowledge?.({ ok: true })
    })

    socket.on("chat:message", async (data = {}) => {
      const { conversation_id, message_type } = data
      const content = typeof data.content === "string" ? data.content.trim() : ""
      if (
        typeof conversation_id !== "string" ||
        !content ||
        content.length > CHAT_TEXT_MAX_LENGTH ||
        (message_type && message_type !== "text")
      ) {
        socket.emit("chat:error", { code: "INVALID_MESSAGE", message: "Invalid message" })
        return
      }

      if (!containerRef) {
        socket.emit("chat:error", { code: "SERVER_NOT_READY", message: "Server not ready" })
        return
      }

      const conversation = await getAuthorizedConversation(conversation_id, identity)
      if (!conversation) {
        socket.emit("chat:error", { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" })
        return
      }
      if (conversation.status === "closed") {
        socket.emit("chat:error", { code: "CONVERSATION_CLOSED", message: "Conversation is closed" })
        return
      }

      try {
        authorizedConversations.add(conversation_id)
        await socket.join(`conversation:${conversation_id}`)

        const { result: message } = await sendMessageWorkflow(containerRef).run({
          input: {
            conversation_id,
            sender_type: identity.role,
            sender_id: identity.id,
            content,
            message_type: "text",
          },
        })

        broadcastChatMessage(conversation_id, message as any)

        if (identity.role !== "agent") {
          broadcastConversationActivity(conversation_id, {
            content,
            message_type: "text",
            sender_type: identity.role,
          })

          // AI自动回复
          handleAIResponse(conversation_id, containerRef)
        }
      } catch (err) {
        console.error("[socket.io] Error sending message:", err)
        socket.emit("chat:error", { code: "MESSAGE_FAILED", message: "Failed to send message" })
      }
    })

    socket.on("chat:typing", async ({ conversation_id } = {}) => {
      if (typeof conversation_id !== "string") return

      if (!authorizedConversations.has(conversation_id)) {
        const conversation = await getAuthorizedConversation(conversation_id, identity)
        if (!conversation) return
        authorizedConversations.add(conversation_id)
      }

      socket.to(`conversation:${conversation_id}`).emit("chat:typing", {
        conversation_id,
        sender_type: identity.role,
      })
    })

    socket.on("disconnect", () => {
      console.log(`[socket.io] ${identity.role} disconnected: ${identity.id}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`[socket.io] Listening on port ${port}`)
  })

  return io
}

async function handleAIResponse(conversationId: string, container: MedusaContainer) {
  const existingTimer = aiDebounceTimers.get(conversationId)
  if (existingTimer) clearTimeout(existingTimer)

  try {
    const chatService: ChatModuleService = container.resolve(CHAT_MODULE)
    const settings = await chatService.listChatSettings({}, { take: 1 })
    const config = settings[0]

    if (!config?.ai_enabled || !config.ai_api_key) return

    const timer = setTimeout(async () => {
      try {
        const messages = await chatService.listChatMessages(
          { conversation_id: conversationId },
          { select: ["sender_type", "content", "message_type", "created_at"], order: { created_at: "ASC" } }
        )

        const aiResponse = await generateAIResponse(config as any, messages)

        const { result: aiMessage } = await sendMessageWorkflow(container).run({
          input: {
            conversation_id: conversationId,
            sender_type: "agent",
            sender_id: "ai-assistant",
            content: aiResponse,
            message_type: "text",
            metadata: { ai_generated: true },
          },
        })

        broadcastChatMessage(conversationId, aiMessage as any)

        aiDebounceTimers.delete(conversationId)
      } catch (err) {
        console.error("[AI] Error generating response:", err)
        aiDebounceTimers.delete(conversationId)
      }
    }, (config.ai_debounce_seconds || 3) * 1000)

    aiDebounceTimers.set(conversationId, timer)
  } catch (err) {
    console.error("[AI] Error setting up AI response:", err)
  }
}

export function triggerAIResponse(conversationId: string, container: MedusaContainer) {
  handleAIResponse(conversationId, container)
}
