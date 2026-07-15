import {
  createRestockRequest,
  getRestockRequestStatus,
  getRestockSalesChannelId,
} from "../helpers"
import { RESTOCK_DEMAND_MODULE } from "../../../../modules/restock-demand"
import { getRestockVariantSnapshot } from "../../../../lib/restock-demand"

function createHarness() {
  let inventoryQuantity = 0
  let roundSequence = 0
  let requesterSequence = 0
  const rounds: any[] = []
  const requesters: any[] = []
  const graphCalls: Array<{ entity: string; fields?: string[] }> = []

  const withRequests = (round: any) => ({
    ...round,
    requests: requesters.filter((request) => request.round_id === round.id),
  })

  const service = {
    async listRestockRounds(filters: Record<string, unknown>) {
      return rounds
        .filter((round) => Object.entries(filters).every(([key, value]) => round[key] === value))
        .map(withRequests)
    },
    async createRestockRounds(input: Record<string, unknown>) {
      const round = {
        ...input,
        id: `round_${++roundSequence}`,
        created_at: new Date(),
        restocked_at: null,
      }
      rounds.push(round)
      return withRequests(round)
    },
    async retrieveRestockRound(id: string) {
      return withRequests(rounds.find((round) => round.id === id))
    },
    async updateRestockRounds(input: Record<string, unknown>) {
      const round = rounds.find((candidate) => candidate.id === input.id)
      Object.assign(round, input)
      return withRequests(round)
    },
    async createRestockRequesters(input: Record<string, unknown>) {
      const requester = {
        ...input,
        id: `requester_${++requesterSequence}`,
        created_at: new Date(),
      }
      requesters.push(requester)
      return requester
    },
    async listRestockRequesters(filters: Record<string, unknown>) {
      return requesters.filter((requester) => (
        Object.entries(filters).every(([key, value]) => requester[key] === value)
      ))
    },
  }

  const query = {
    async graph({ entity, fields }: { entity: string; fields?: string[] }) {
      graphCalls.push({ entity, fields })
      if (entity === "customer") {
        return { data: [{ id: "cus_1", email: "customer@example.com", first_name: "Test", last_name: "User" }] }
      }
      if (entity === "product_variant_inventory_items") {
        return {
          data: [{
            variant_id: "variant_1",
            required_quantity: 1,
            variant: { manage_inventory: true, allow_backorder: false },
            inventory: {
              location_levels: [{
                location_id: "location_1",
                available_quantity: inventoryQuantity,
              }],
            },
          }],
        }
      }
      if (entity === "sales_channel_locations") {
        return { data: [{ stock_location_id: "location_1" }] }
      }
      return {
        data: [{
          id: "variant_1",
          title: "Box of 10",
          sku: "SKU-1",
          product_id: "product_1",
          product: { id: "product_1", title: "Test product" },
          manage_inventory: true,
          options: [{ value: "10", option: { title: "Pack" } }],
        }],
      }
    },
  }

  const container = {
    resolve(key: string) {
      if (key === RESTOCK_DEMAND_MODULE) return service
      if (key === "query") return query
      throw new Error(`Unexpected dependency: ${key}`)
    },
  }

  return {
    container,
    rounds,
    requesters,
    graphCalls,
    setInventoryQuantity(value: number) {
      inventoryQuantity = value
    },
  }
}

describe("restock request lifecycle", () => {
  it("uses the single sales channel from the publishable API key", () => {
    expect(getRestockSalesChannelId({
      publishable_key_context: { sales_channel_ids: ["sales_channel_1"] },
    })).toBe("sales_channel_1")
  })

  it("rejects an ambiguous storefront sales channel context", () => {
    expect(() => getRestockSalesChannelId({
      publishable_key_context: { sales_channel_ids: [] },
    })).toThrow("exactly one sales channel")
  })

  it("uses total availability when no storefront sales channel context exists", async () => {
    const harness = createHarness()
    harness.setInventoryQuantity(7)

    const snapshot = await getRestockVariantSnapshot(
      harness.container,
      "variant_1"
    )

    expect(snapshot?.available_quantity).toBe(7)
    expect(
      harness.graphCalls.some((call) => call.entity === "sales_channel_locations")
    ).toBe(false)
  })

  it("deduplicates an anonymous browser within a round", async () => {
    const harness = createHarness()
    const input = {
      variant_id: "variant_1",
      visitor_id: "browser_123",
      sales_channel_id: "sales_channel_1",
    }

    const first = await createRestockRequest(harness.container, input)
    const second = await createRestockRequest(harness.container, input)

    expect(first.round_id).toBe(second.round_id)
    expect(second.requester_count).toBe(1)
    expect(harness.requesters).toHaveLength(1)
    const variantQuery = harness.graphCalls.find((call) => call.entity === "product_variant")
    expect(variantQuery?.fields).not.toContain("inventory_quantity")
    expect(harness.graphCalls.some((call) => call.entity === "sales_channel_locations")).toBe(true)
  })

  it("deduplicates a customer and keeps their profile snapshot", async () => {
    const harness = createHarness()
    const input = {
      variant_id: "variant_1",
      customer_id: "cus_1",
      sales_channel_id: "sales_channel_1",
    }

    await createRestockRequest(harness.container, input)
    const result = await createRestockRequest(harness.container, input)

    expect(result.requester_count).toBe(1)
    expect(harness.requesters[0]).toMatchObject({
      customer_id: "cus_1",
      customer_email: "customer@example.com",
      customer_first_name: "Test",
      customer_last_name: "User",
    })
  })

  it("archives a stocked round and opens a new round after the next stockout", async () => {
    const harness = createHarness()
    const input = {
      variant_id: "variant_1",
      visitor_id: "browser_123",
      sales_channel_id: "sales_channel_1",
    }
    const first = await createRestockRequest(harness.container, input)

    harness.setInventoryQuantity(5)
    await expect(getRestockRequestStatus(harness.container, input)).resolves.toEqual({
      requested: false,
      round_id: null,
      requester_count: 0,
    })
    expect(harness.rounds[0].status).toBe("restocked")

    harness.setInventoryQuantity(0)
    const second = await createRestockRequest(harness.container, input)
    expect(second.round_id).not.toBe(first.round_id)
    expect(second.requester_count).toBe(1)
    expect(harness.rounds).toHaveLength(2)
  })
})
