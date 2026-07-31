import assert from "node:assert/strict"
import test from "node:test"
import {
  formatConversationReference,
  getNextConversationOffset,
} from "./chat-conversations"

test("returns the next conversation page offset while more results exist", () => {
  assert.equal(
    getNextConversationOffset({
      conversations: Array.from({ length: 50 }, (_, index) => ({ id: String(index) })),
      count: 75,
      offset: 0,
    }),
    50
  )
})

test("stops conversation pagination at the end or on an empty page", () => {
  assert.equal(
    getNextConversationOffset({
      conversations: [{ id: "conv_75" }],
      count: 75,
      offset: 74,
    }),
    undefined
  )
  assert.equal(
    getNextConversationOffset({ conversations: [], count: 75, offset: 50 }),
    undefined
  )
})

test("formats a compact but stable conversation reference", () => {
  assert.equal(
    formatConversationReference("550e8400-e29b-41d4-a716-446655440000"),
    "#550e8400...0000"
  )
  assert.equal(formatConversationReference("customer_123"), "#customer_123")
  assert.equal(formatConversationReference(null), null)
})
