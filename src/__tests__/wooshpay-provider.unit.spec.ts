jest.mock("@medusajs/framework/utils", () => {
  class MedusaError extends Error {
    static Types = {
      INVALID_DATA: "invalid_data",
      NOT_FOUND: "not_found",
      NOT_ALLOWED: "not_allowed",
      UNAUTHORIZED: "unauthorized",
      DUPLICATE_ERROR: "duplicate_error",
    }
    type: string

    constructor(type: string, message: string) {
      super(message)
      this.name = "MedusaError"
      this.type = type
    }
  }

  return {
    AbstractPaymentProvider: class {
      protected container: Record<string, unknown>

      constructor(container: Record<string, unknown> = {}) {
        this.container = container
      }
    },
    MedusaError,
    PaymentSessionStatus: {
      PENDING: "pending",
      CAPTURED: "captured",
      AUTHORIZED: "authorized",
      CANCELED: "canceled",
      ERROR: "error",
    },
  }
})

jest.mock("pg", () => ({
  Pool: jest.fn(),
}))

import crypto from "crypto"

describe("WooShPayPaymentProvider", () => {
  const ProviderService = require("../providers/wooshpay-provider")
  const Provider = (ProviderService.default ?? ProviderService).services[0]

  const makeProvider = () => new Provider({
    payment_settings: {
      listPaymentProviderSettings: jest.fn().mockResolvedValue([
        {
          api_key: "sk_test",
          sandbox_mode: true,
        },
      ]),
    },
  })

  const mockFetchResponse = (body: unknown, ok = true, status = ok ? 200 : 400) => ({
    ok,
    status,
    text: async () => typeof body === "string" ? body : JSON.stringify(body),
  } as Response)

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it("creates UnionPay checkout session payload without top-level return_url", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      mockFetchResponse({
        id: "cs_test",
        url: "https://checkout.wooshpay.test/pay/cs_test",
        status: "open",
      })
    )
    const provider = makeProvider()
    const successUrl = "https://store.test/zh-TW/checkout/return?cart_id=cart_test"
    const cancelUrl = "https://store.test/zh-TW/checkout/return?cart_id=cart_test&status=cancelled"

    await provider.initiatePayment({
      amount: 1234,
      currency_code: "gbp",
      data: {
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ["unionpay"],
      },
      context: {
        payment_session_id: "payses_test",
        customer: { email: "customer@example.com" },
      },
    })

    const [, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((options as RequestInit).body))

    expect(body).toMatchObject({
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["unionpay"],
      client_reference_id: "payses_test",
      metadata: {
        session_id: "payses_test",
        medusa_payment_session_id: "payses_test",
      },
      payment_intent_data: {
        metadata: {
          session_id: "payses_test",
          medusa_payment_session_id: "payses_test",
        },
      },
    })
    expect(body).not.toHaveProperty("return_url")
  })

  it("accepts WooshPay webhook signatures from the Signature header", async () => {
    const webhookSecret = "whsec_test"
    const rawBody = JSON.stringify({
      type: "payment_intent.succeeded",
      data: {
        object: {
          amount_received: 1234,
          metadata: {
            session_id: "payses_test",
          },
        },
      },
    })
    const timestamp = "1710000000"
    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex")
    const provider = new Provider({
      payment_settings: {
        listPaymentProviderSettings: jest.fn().mockResolvedValue([
          {
            api_key: "sk_test",
            webhook_secret: webhookSecret,
            sandbox_mode: true,
          },
        ]),
      },
    })

    const result = await provider.getWebhookActionAndData({
      data: rawBody,
      rawData: rawBody,
      headers: {
        Signature: `t=${timestamp},v1=${signature}`,
      },
    })

    expect(result).toEqual({
      action: "captured",
      data: {
        session_id: "payses_test",
        amount: 1234,
      },
    })
  })

  it("refunds with payment_intent_id stored on provider data", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      mockFetchResponse({ id: "re_test", status: "succeeded" })
    )
    const provider = makeProvider()

    const result = await provider.refundPayment({
      amount: 1234,
      data: {
        payment_intent_id: "pi_direct",
      },
      context: {
        idempotency_key: "refund_test",
      },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((options as RequestInit).body))

    expect(String(url)).toBe("https://apitest.wooshpay.com/v1/refunds")
    expect(body).toEqual({
      payment_intent: "pi_direct",
      amount: 1234,
    })
    expect((result.data as Record<string, unknown>).payment_intent_id).toBe("pi_direct")
    expect((result.data as Record<string, unknown>).last_refund_id).toBe("re_test")
  })

  it("refunds with nested payment intent aliases from raw charge data", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      mockFetchResponse({ id: "re_nested", status: "succeeded" })
    )
    const provider = makeProvider()

    await provider.refundPayment({
      amount: { value: 4321 },
      data: {
        raw: {
          charges: {
            data: [
              {
                paymentIntent: {
                  id: "pi_nested",
                },
              },
            ],
          },
        },
      },
      context: {},
    })

    const [, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((options as RequestInit).body))

    expect(body).toMatchObject({
      payment_intent: "pi_nested",
      amount: 4321,
    })
  })

  it("looks up the checkout session when provider data only has a checkout session id", async () => {
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        mockFetchResponse({
          id: "cs_test",
          payment_intent: {
            id: "pi_from_session",
          },
        })
      )
      .mockResolvedValueOnce(
        mockFetchResponse({ id: "re_session", status: "succeeded" })
      )
    const provider = makeProvider()

    const result = await provider.refundPayment({
      amount: 500,
      data: {
        checkout_session_id: "cs_test",
      },
      context: {},
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://apitest.wooshpay.com/v1/checkout/sessions/cs_test")
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://apitest.wooshpay.com/v1/refunds")

    const refundBody = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body))
    expect(refundBody).toMatchObject({
      payment_intent: "pi_from_session",
      amount: 500,
    })
    expect((result.data as Record<string, unknown>).payment_intent_id).toBe("pi_from_session")
  })

  it("throws a diagnosable MedusaError when no payment intent can be resolved", async () => {
    const fetchMock = jest.spyOn(global, "fetch")
    const provider = makeProvider()

    await expect(provider.refundPayment({
      amount: 500,
      data: {},
      context: {},
    })).rejects.toMatchObject({
      name: "MedusaError",
      type: "invalid_data",
      message: expect.stringContaining("payment_intent_id"),
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("throws a diagnosable and redacted MedusaError for WooShPay refund API failures", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockFetchResponse({
        error: {
          code: "refund_failed",
          type: "invalid_request_error",
          message: "Refund denied for api_key=sk_test_secret and payment pi_test",
        },
      }, false, 402)
    )
    const provider = makeProvider()

    let thrown: unknown
    try {
      await provider.refundPayment({
        amount: 500,
        data: {
          payment_intent: "pi_test",
        },
        context: {},
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toMatchObject({
      name: "MedusaError",
      type: "invalid_data",
      message: expect.stringContaining("WooShPay API error 402"),
    })
    expect((thrown as Error).message).toContain("code=refund_failed")
    expect((thrown as Error).message).not.toContain("sk_test_secret")
  })

  it("redacts nested sensitive diagnostic fields from WooShPay refund API failures", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      mockFetchResponse({
        error: {
          code: "refund_failed",
          message: [
            "client_secret=cs_secret_value",
            "access_token: access_token_value",
            "x-api-key: x_api_key_value",
            "Authorization: Bearer bearer_token_value",
            "proxy_authorization: Basic basic_token_value",
            "{\"client_secret\":\"json_client_secret\",\"access_token\":\"json_access_token\",\"x-api-key\":\"json_api_key\"}",
          ].join(" "),
        },
      }, false, 400)
    )
    const provider = makeProvider()

    let thrown: unknown
    try {
      await provider.refundPayment({
        amount: 500,
        data: {
          payment_intent: "pi_test",
        },
        context: {},
      })
    } catch (error) {
      thrown = error
    }

    const message = (thrown as Error).message
    expect(message).toContain("[redacted]")
    expect(message).not.toContain("cs_secret_value")
    expect(message).not.toContain("access_token_value")
    expect(message).not.toContain("x_api_key_value")
    expect(message).not.toContain("bearer_token_value")
    expect(message).not.toContain("basic_token_value")
    expect(message).not.toContain("json_client_secret")
    expect(message).not.toContain("json_access_token")
    expect(message).not.toContain("json_api_key")
  })

  it("treats terminal cancel API status errors as no-op", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      mockFetchResponse({
        status: "succeeded",
      }, false, 400)
    )
    const provider = makeProvider()
    const data = {
      checkout_session_id: "cs_test",
    }

    const result = await provider.cancelPayment({
      data,
      context: {
        idempotency_key: "cancel_test",
      },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://apitest.wooshpay.com/v1/checkout/sessions/cs_test/expire")
    expect(result.data).toBe(data)
  })

  it("wraps missing WooShPay API key as a diagnosable refund error", async () => {
    const provider = new Provider({
      payment_settings: {
        listPaymentProviderSettings: jest.fn().mockResolvedValue([]),
      },
    })

    await expect(provider.refundPayment({
      amount: 500,
      data: {
        payment_intent: "pi_test",
      },
      context: {},
    })).rejects.toMatchObject({
      name: "MedusaError",
      type: "invalid_data",
      message: expect.stringContaining("API key is not configured"),
    })
  })
})
