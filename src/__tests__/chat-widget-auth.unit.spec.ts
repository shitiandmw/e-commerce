type FetchResponse = {
  status: number
  ok: boolean
  json: () => Promise<unknown>
}

class MemoryStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

function response(status: number, body: unknown = {}): FetchResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }
}

function setupWidget(credentials?: {
  customerToken?: string
  conversationToken?: string
}) {
  const storage = new MemoryStorage()
  storage.setItem("timecigar_chat_visitor_id", "visitor_12345678")
  if (credentials?.customerToken) {
    storage.setItem("medusa_customer_token", credentials.customerToken)
  }
  if (credentials?.conversationToken) {
    storage.setItem(
      "timecigar_chat_conversation_token",
      credentials.conversationToken
    )
  }

  const dispatchEvent = jest.fn()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  })
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      __TIMECIGAR_CHAT_CONFIG__: { publishableKey: "pk_test" },
      dispatchEvent,
    },
  })
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      querySelector: () => ({
        src: "https://api.example.com/chat/widget",
        dataset: {},
      }),
    },
  })

  return { storage, dispatchEvent }
}

describe("chat widget credential recovery", () => {
  afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
    Reflect.deleteProperty(globalThis, "localStorage")
    Reflect.deleteProperty(globalThis, "window")
    Reflect.deleteProperty(globalThis, "document")
  })

  it("clears an invalid customer token and retries once as a visitor", async () => {
    const { storage, dispatchEvent } = setupWidget({
      customerToken: "expired_customer_token",
      conversationToken: "stale_conversation_token",
    })
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401) as Response)
      .mockResolvedValueOnce(response(200, {
        conversation: { id: "conv_visitor" },
        conversation_token: "fresh_conversation_token",
      }) as Response)

    const { createConversation } = require("../chat-widget/api")
    const result = await createConversation()

    expect(result).toEqual({
      id: "conv_visitor",
      conversationToken: "fresh_conversation_token",
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const firstRequest = fetchMock.mock.calls[0][1] as RequestInit
    const secondRequest = fetchMock.mock.calls[1][1] as RequestInit
    expect(firstRequest.headers).toMatchObject({
      Authorization: "Bearer expired_customer_token",
      "x-publishable-api-key": "pk_test",
    })
    expect(JSON.parse(firstRequest.body as string)).toEqual({
      visitor_id: "visitor_12345678",
    })
    expect(secondRequest.headers).not.toHaveProperty("Authorization")
    expect(secondRequest.headers).not.toHaveProperty(
      "x-chat-conversation-token"
    )
    expect(JSON.parse(secondRequest.body as string)).toEqual({
      visitor_id: "visitor_12345678",
    })
    expect(storage.getItem("medusa_customer_token")).toBeNull()
    expect(storage.getItem("timecigar_chat_conversation_token")).toBeNull()
    expect(dispatchEvent).toHaveBeenCalledTimes(1)
    expect(dispatchEvent.mock.calls[0][0].type).toBe("auth-change")
  })

  it("clears an invalid visitor token and retries without changing auth", async () => {
    const { storage, dispatchEvent } = setupWidget({
      conversationToken: "expired_conversation_token",
    })
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401) as Response)
      .mockResolvedValueOnce(response(200, {
        conversation: { id: "conv_new" },
        conversation_token: "new_conversation_token",
      }) as Response)

    const { createConversation } = require("../chat-widget/api")
    await createConversation()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      "x-chat-conversation-token": "expired_conversation_token",
    })
    expect(fetchMock.mock.calls[1][1]?.headers).not.toHaveProperty(
      "x-chat-conversation-token"
    )
    expect(storage.getItem("timecigar_chat_conversation_token")).toBeNull()
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it("does not retry an anonymous 401", async () => {
    setupWidget()
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response(401) as Response)

    const { createConversation } = require("../chat-widget/api")

    await expect(createConversation()).rejects.toThrow(
      "Create conversation failed: 401"
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("stops after one retry when the unauthenticated request also fails", async () => {
    setupWidget({ customerToken: "invalid_customer_token" })
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response(401) as Response)

    const { createConversation } = require("../chat-widget/api")

    await expect(createConversation()).rejects.toThrow(
      "Create conversation failed: 401"
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("keeps a valid customer token when conversation creation succeeds", async () => {
    const { storage, dispatchEvent } = setupWidget({
      customerToken: "valid_customer_token",
    })
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response(200, {
        conversation: { id: "conv_customer" },
        conversation_token: null,
      }) as Response)

    const { createConversation } = require("../chat-widget/api")
    const result = await createConversation()

    expect(result).toEqual({ id: "conv_customer", conversationToken: null })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(storage.getItem("medusa_customer_token")).toBe(
      "valid_customer_token"
    )
    expect(dispatchEvent).not.toHaveBeenCalled()
  })
})
