import jwt from "jsonwebtoken"
import {
  canAccessConversation,
  signVisitorConversationToken,
  verifyMedusaChatActorToken,
  verifyVisitorConversationToken,
} from "../lib/chat-auth"
import {
  buildChatMessagePreview,
  CHAT_IMAGE_MAX_BYTES,
  isAllowedChatImageUrl,
} from "../lib/chat-message"
import { PostAdminSendChatMessage } from "../api/admin/chat/validators"

describe("chat messages and authorization", () => {
  const originalSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = "chat-unit-test-secret"
  })

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = originalSecret
    }
  })

  it("derives chat roles from the signed Medusa actor type", () => {
    const customerToken = jwt.sign(
      { actor_id: "cus_1", actor_type: "customer" },
      process.env.JWT_SECRET!
    )
    const agentToken = jwt.sign(
      { actor_id: "user_1", actor_type: "user" },
      process.env.JWT_SECRET!
    )

    expect(verifyMedusaChatActorToken(customerToken)).toEqual({
      role: "customer",
      id: "cus_1",
    })
    expect(verifyMedusaChatActorToken(agentToken)).toEqual({
      role: "agent",
      id: "user_1",
    })
  })

  it("binds a visitor token to one visitor and conversation", () => {
    const token = signVisitorConversationToken({
      conversation_id: "conv_1",
      visitor_id: "visitor_1",
    })
    const identity = verifyVisitorConversationToken(token)

    expect(identity).toEqual({
      role: "visitor",
      id: "visitor_1",
      conversation_id: "conv_1",
    })
    expect(canAccessConversation(identity!, {
      id: "conv_1",
      visitor_id: "visitor_1",
    })).toBe(true)
    expect(canAccessConversation(identity!, {
      id: "conv_2",
      visitor_id: "visitor_1",
    })).toBe(false)
  })

  it("allows customers to access only their own conversations", () => {
    const identity = { role: "customer" as const, id: "cus_1" }

    expect(canAccessConversation(identity, {
      id: "conv_1",
      customer_id: "cus_1",
    })).toBe(true)
    expect(canAccessConversation(identity, {
      id: "conv_2",
      customer_id: "cus_2",
    })).toBe(false)
  })

  it("uses a stable image preview instead of exposing the URL", () => {
    expect(buildChatMessagePreview({
      content: "https://api.example.com/static/image.webp",
      message_type: "image",
    })).toBe("[图片]")
  })

  it("accepts same-origin static images and configured CDN images", () => {
    expect(isAllowedChatImageUrl(
      "https://api.example.com/static/image.webp",
      "https://api.example.com"
    )).toBe(true)
    expect(isAllowedChatImageUrl(
      "https://cdn.example.com/chat/image.webp",
      "https://api.example.com",
      "https://cdn.example.com"
    )).toBe(true)
    expect(isAllowedChatImageUrl(
      "https://attacker.example/image.webp",
      "https://api.example.com"
    )).toBe(false)
  })

  it("validates image message metadata and limits", () => {
    const valid = {
      message_type: "image",
      content: "https://api.example.com/static/image.webp",
      metadata: {
        file_id: "image.webp",
        file_name: "image.webp",
        mime_type: "image/webp",
        size: CHAT_IMAGE_MAX_BYTES,
      },
    }

    expect(PostAdminSendChatMessage.safeParse(valid).success).toBe(true)
    expect(PostAdminSendChatMessage.safeParse({
      ...valid,
      metadata: { ...valid.metadata, mime_type: "image/svg+xml" },
    }).success).toBe(false)
    expect(PostAdminSendChatMessage.safeParse({
      ...valid,
      metadata: { ...valid.metadata, size: CHAT_IMAGE_MAX_BYTES + 1 },
    }).success).toBe(false)
  })
})
