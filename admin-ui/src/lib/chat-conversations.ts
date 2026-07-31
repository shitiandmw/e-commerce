export interface ConversationPage {
  conversations: Array<{ id: string }>
  count: number
  offset: number
}

export function getNextConversationOffset(
  page: ConversationPage
): number | undefined {
  if (page.conversations.length === 0) return undefined

  const nextOffset = page.offset + page.conversations.length
  return nextOffset < page.count ? nextOffset : undefined
}

export function formatConversationReference(
  id: string | null | undefined
): string | null {
  const value = id?.trim()
  if (!value) return null
  if (value.length <= 12) return `#${value}`

  return `#${value.slice(0, 8)}...${value.slice(-4)}`
}
