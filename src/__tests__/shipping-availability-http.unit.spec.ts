jest.mock("../lib/shipping-availability", () => {
  const actual = jest.requireActual("../lib/shipping-availability")
  return {
    ...actual,
    prepareCartShippingSnapshot: jest.fn(),
  }
})

import middlewares, {
  prepareCompletedCartShipping,
  preparePaymentSessionCartShipping,
} from "../api/middlewares"
import {
  createShippingAvailabilityError,
  prepareCartShippingSnapshot,
} from "../lib/shipping-availability"

const mockedPrepare = jest.mocked(prepareCartShippingSnapshot)

function createResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  }
  response.status.mockReturnValue(response)
  return response
}

describe("shipping availability HTTP guards", () => {
  beforeEach(() => {
    mockedPrepare.mockReset().mockResolvedValue({} as any)
  })

  it("reverse looks up and revalidates an existing payment collection for every provider session", async () => {
    const graph = jest.fn().mockResolvedValue({
      data: [{ cart_id: "cart_existing" }],
    })
    const req = {
      params: { id: "pay_col_existing" },
      body: { provider_id: "pp_first" },
      scope: { resolve: jest.fn().mockReturnValue({ graph }) },
    } as any
    const next = jest.fn()

    await preparePaymentSessionCartShipping(req, createResponse() as any, next)
    req.body.provider_id = "pp_switched"
    mockedPrepare.mockRejectedValueOnce(
      createShippingAvailabilityError(
        "SHIPPING_OPTION_INCOMPATIBLE",
        "The shipping configuration changed.",
        { incompatible_items: [{ line_item_id: "item_changed" }] }
      )
    )
    await expect(
      preparePaymentSessionCartShipping(req, createResponse() as any, next)
    ).rejects.toMatchObject({
      shipping_code: "SHIPPING_OPTION_INCOMPATIBLE",
    })

    expect(graph).toHaveBeenCalledWith({
      entity: "cart_payment_collection",
      fields: ["cart_id"],
      filters: { payment_collection_id: "pay_col_existing" },
    })
    expect(mockedPrepare).toHaveBeenCalledTimes(2)
    expect(mockedPrepare).toHaveBeenNthCalledWith(
      1,
      req.scope,
      "cart_existing"
    )
    expect(mockedPrepare).toHaveBeenNthCalledWith(
      2,
      req.scope,
      "cart_existing"
    )
    expect(next).toHaveBeenCalledTimes(1)
  })

  it("returns the unified 409 contract when a payment collection has no cart", async () => {
    const req = {
      params: { id: "pay_col_orphan" },
      scope: {
        resolve: jest.fn().mockReturnValue({
          graph: jest.fn().mockResolvedValue({ data: [] }),
        }),
      },
    } as any
    let thrown: unknown
    try {
      await preparePaymentSessionCartShipping(
        req,
        createResponse() as any,
        jest.fn()
      )
    } catch (error) {
      thrown = error
    }

    const res = createResponse()
    middlewares.errorHandler!(thrown, req, res as any, jest.fn())
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      code: "SHIPPING_PAYMENT_COLLECTION_CART_NOT_FOUND",
      message: "This payment collection is not linked to a cart.",
      details: { payment_collection_id: "pay_col_orphan" },
    })
  })

  it.each([
    ["payment session", preparePaymentSessionCartShipping],
    ["cart completion", prepareCompletedCartShipping],
  ])("blocks %s when pickup contact fields are invalid", async (_name, guard) => {
    const error = createShippingAvailabilityError(
      "PICKUP_CONTACT_INVALID",
      "Pickup contact is required.",
      {
        shipping_option_id: "so_pickup",
        missing_fields: ["shipping_address.phone"],
        invalid_fields: [],
      }
    )
    mockedPrepare.mockRejectedValueOnce(error)
    const graph = jest.fn().mockResolvedValue({
      data: [{ cart_id: "cart_pickup" }],
    })
    const req = {
      params: {
        id: guard === preparePaymentSessionCartShipping
          ? "pay_col_pickup"
          : "cart_pickup",
      },
      scope: { resolve: jest.fn().mockReturnValue({ graph }) },
    } as any
    const next = jest.fn()

    await expect(
      guard(req, createResponse() as any, next)
    ).rejects.toMatchObject({
      shipping_code: "PICKUP_CONTACT_INVALID",
      details: { missing_fields: ["shipping_address.phone"] },
    })
    expect(next).not.toHaveBeenCalled()
  })

  it.each([
    ["payment session", preparePaymentSessionCartShipping],
    ["cart completion", prepareCompletedCartShipping],
  ])("allows %s to continue when pickup contact is valid", async (_name, guard) => {
    const graph = jest.fn().mockResolvedValue({
      data: [{ cart_id: "cart_pickup" }],
    })
    const req = {
      params: {
        id: guard === preparePaymentSessionCartShipping
          ? "pay_col_pickup"
          : "cart_pickup",
      },
      scope: { resolve: jest.fn().mockReturnValue({ graph }) },
    } as any
    const next = jest.fn()

    await guard(req, createResponse() as any, next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["SHIPPING_OPTION_INCOMPATIBLE", { incompatible_items: [{ line_item_id: "item_1" }] }],
    ["SHIPPING_PAYMENT_COLLECTION_CART_NOT_FOUND", { payment_collection_id: "pay_col_1" }],
    ["SHIPPING_SNAPSHOT_REQUIRED", { shipping_option_id: "so_1" }],
    ["SHIPPING_OPTION_IN_USE", { product_count: 2, order_id: "order_1" }],
    ["PICKUP_CONTACT_INVALID", {
      missing_fields: ["shipping_address.phone"],
      invalid_fields: ["email"],
    }],
    ["SHIPPING_INCOMPATIBLE_ITEMS_KEEP_ONE", {
      line_item_ids: ["item_1"],
      item_count: 1,
      remaining_item_count: 0,
    }],
    ["SHIPPING_INCOMPATIBLE_ITEMS_CHANGED", {
      invalid_line_item_ids: ["item_stale"],
    }],
  ])("serializes %s conflicts with their details", (code, details) => {
    const error = createShippingAvailabilityError(code, "Conflict", details)
    const res = createResponse()
    middlewares.errorHandler!(error, {} as any, res as any, jest.fn())

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ code, message: "Conflict", details })
  })
})
