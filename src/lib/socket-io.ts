import { Server as SocketIOServer } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import Redis from "ioredis"
import jwt from "jsonwebtoken"
import http from "http"
import { MedusaContainer } from "@medusajs/framework/types"
import { sendMessageWorkflow } from "../workflows/chat/send-message"

let io: SocketIOServer | null = null
let containerRef: MedusaContainer | null = null

export function getSocketIO(): SocketIOServer | null {
  return io
}

export function setContainer(container: MedusaContainer): void {
  containerRef = container
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
    const { role, token, visitor_id } = socket.handshake.auth

    if (role === "agent" && token) {
      try {
        const secret = process.env.JWT_SECRET || "supersecret"
        const payload = jwt.verify(token, secret) as any
        socket.data.role = "agent"
        socket.data.agentId = payload.actor_id || payload.sub || payload.id
        return next()
      } catch {
        return next(new Error("Invalid agent token"))
      }
    }

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "supersecret"
        const payload = jwt.verify(token, secret) as any
        socket.data.role = "customer"
        socket.data.customerId = payload.actor_id || payload.sub || payload.id
        return next()
      } catch {
        // Token invalid, fall through to visitor
      }
    }

    socket.data.role = "visitor"
    socket.data.visitorId = visitor_id || `visitor_${Date.now()}`
    next()
  })

  // Connection handler
  io.on("connection", (socket) => {
    const { role, agentId, customerId, visitorId } = socket.data
    console.log(`[socket.io] ${role} connected: ${agentId || customerId || visitorId}`)

    if (role === "agent") {
      socket.join("agents")
    }

    socket.on("chat:join", ({ conversation_id }) => {
      if (conversation_id) {
        socket.join(`conversation:${conversation_id}`)
      }
    })

    socket.on("chat:message", async (data) => {
      const { conversation_id, content, message_type } = data
      if (!conversation_id || !content) return

      if (!containerRef) {
        socket.emit("chat:error", { message: "Server not ready" })
        return
      }

      let senderType: string
      let senderId: string

      if (role === "agent") {
        senderType = "agent"
        senderId = agentId
      } else if (role === "customer") {
        senderType = "customer"
        senderId = customerId
      } else {
        senderType = "visitor"
        senderId = visitorId
      }

      try {
        const { result: message } = await sendMessageWorkflow(containerRef).run({
          input: {
            conversation_id,
            sender_type: senderType as any,
            sender_id: senderId,
            content,
            message_type: message_type || "text",
          },
        })

        io!.to(`conversation:${conversation_id}`).emit("chat:message", {
          id: message.id,
          conversation_id,
          sender_type: senderType,
          sender_id: senderId,
          content,
          message_type: message_type || "text",
          created_at: message.created_at,
        })

        if (senderType !== "agent") {
          io!.to("agents").emit("chat:conversation:activity", {
            conversation_id,
            last_message_preview: content.substring(0, 100),
            sender_type: senderType,
          })
        }
      } catch (err) {
        console.error("[socket.io] Error sending message:", err)
        socket.emit("chat:error", { message: "Failed to send message" })
      }
    })

    socket.on("chat:typing", ({ conversation_id }) => {
      if (!conversation_id) return
      socket.to(`conversation:${conversation_id}`).emit("chat:typing", {
        conversation_id,
        sender_type: role,
      })
    })

    socket.on("disconnect", () => {
      console.log(`[socket.io] ${role} disconnected: ${agentId || customerId || visitorId}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`[socket.io] Listening on port ${port}`)
  })

  return io
}
