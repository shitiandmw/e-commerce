import {
  CHAT_CONVERSATION_ORDER,
  GET as getConversations,
} from "../api/admin/chat/conversations/route"

describe("admin chat conversations", () => {
  it("orders every page by recent activity with empty conversations last", async () => {
    const graph = jest.fn().mockResolvedValue({
      data: [{ id: "conv_recent" }],
      metadata: { count: 75, skip: 50, take: 25 },
    })
    const json = jest.fn()
    const req = {
      query: { status: "open" },
      queryConfig: {
        fields: ["id", "last_message_at"],
        pagination: {
          skip: 50,
          take: 25,
          order: { created_at: "asc" },
        },
      },
      scope: {
        resolve: jest.fn().mockReturnValue({ graph }),
      },
    }

    await getConversations(req as any, { json } as any)

    expect(graph).toHaveBeenCalledWith({
      entity: "conversation",
      fields: ["id", "last_message_at"],
      filters: { status: "open" },
      pagination: {
        skip: 50,
        take: 25,
        order: CHAT_CONVERSATION_ORDER,
      },
    })
    expect(json).toHaveBeenCalledWith({
      conversations: [{ id: "conv_recent" }],
      count: 75,
      offset: 50,
      limit: 25,
    })
  })
})
