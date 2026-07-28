import jwt, { JwtPayload } from "jsonwebtoken"

export type ChatActor =
  | { role: "agent"; id: string }
  | { role: "customer"; id: string }

export type VisitorConversationIdentity = {
  role: "visitor"
  id: string
  conversation_id: string
}

export type ChatIdentity = ChatActor | VisitorConversationIdentity

type MedusaActorPayload = JwtPayload & {
  actor_id?: string
  actor_type?: string
}

type VisitorConversationPayload = JwtPayload & {
  purpose?: string
  conversation_id?: string
  visitor_id?: string
}

const VISITOR_TOKEN_PURPOSE = "chat_visitor_conversation"
const VISITOR_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "supersecret"
}

export function extractBearerToken(
  authorization: string | string[] | undefined
): string | null {
  const value = Array.isArray(authorization) ? authorization[0] : authorization
  if (!value) return null

  const match = /^Bearer\s+(.+)$/i.exec(value.trim())
  return match?.[1] || null
}

export function verifyMedusaChatActorToken(token: string): ChatActor | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as MedusaActorPayload
    const actorId = payload.actor_id || payload.sub

    if (!actorId) return null
    if (payload.actor_type === "user") {
      return { role: "agent", id: actorId }
    }
    if (payload.actor_type === "customer") {
      return { role: "customer", id: actorId }
    }

    return null
  } catch {
    return null
  }
}

export function signVisitorConversationToken(input: {
  conversation_id: string
  visitor_id: string
}): string {
  return jwt.sign(
    {
      purpose: VISITOR_TOKEN_PURPOSE,
      conversation_id: input.conversation_id,
      visitor_id: input.visitor_id,
    },
    getJwtSecret(),
    { expiresIn: VISITOR_TOKEN_TTL_SECONDS }
  )
}

export function verifyVisitorConversationToken(
  token: string
): VisitorConversationIdentity | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as VisitorConversationPayload
    if (
      payload.purpose !== VISITOR_TOKEN_PURPOSE ||
      !payload.conversation_id ||
      !payload.visitor_id
    ) {
      return null
    }

    return {
      role: "visitor",
      id: payload.visitor_id,
      conversation_id: payload.conversation_id,
    }
  } catch {
    return null
  }
}

export function canAccessConversation(
  identity: ChatIdentity,
  conversation: {
    id: string
    customer_id?: string | null
    visitor_id?: string | null
  }
): boolean {
  if (identity.role === "agent") return true
  if (identity.role === "customer") {
    return conversation.customer_id === identity.id
  }

  return (
    identity.conversation_id === conversation.id &&
    conversation.visitor_id === identity.id
  )
}

export function resolveStoreChatIdentity(input: {
  authorization?: string | string[]
  conversationToken?: string | string[]
}): Exclude<ChatIdentity, { role: "agent" }> | null {
  const bearerToken = extractBearerToken(input.authorization)
  if (bearerToken) {
    const actor = verifyMedusaChatActorToken(bearerToken)
    return actor?.role === "customer" ? actor : null
  }

  const token = Array.isArray(input.conversationToken)
    ? input.conversationToken[0]
    : input.conversationToken
  return token ? verifyVisitorConversationToken(token) : null
}
