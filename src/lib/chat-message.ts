export const CHAT_TEXT_MAX_LENGTH = 4000
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const CHAT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export function buildChatMessagePreview(input: {
  content: string
  message_type?: "text" | "image" | "system"
}): string {
  if (input.message_type === "image") return "[图片]"
  return input.content.substring(0, 100)
}

export function isAllowedChatImageUrl(
  value: string,
  requestOrigin: string,
  configuredOrigins = process.env.CHAT_IMAGE_ALLOWED_ORIGINS || ""
): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return false

    const normalizedRequestOrigin = new URL(requestOrigin).origin
    if (url.origin === normalizedRequestOrigin) {
      return url.pathname.startsWith("/static/")
    }

    const allowedOrigins = configuredOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => new URL(origin).origin)

    return allowedOrigins.includes(url.origin)
  } catch {
    return false
  }
}
