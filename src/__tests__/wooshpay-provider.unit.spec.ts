jest.mock("@medusajs/framework/utils", () => ({
  AbstractPaymentProvider: class {
    protected container: Record<string, unknown>

    constructor(container: Record<string, unknown> = {}) {
      this.container = container
    }
  },
  PaymentSessionStatus: {
    PENDING: "pending",
    CAPTURED: "captured",
    AUTHORIZED: "authorized",
    CANCELED: "canceled",
    ERROR: "error",
  },
}))

jest.mock("pg", () => ({
  Pool: jest.fn(),
}))

describe("WooShPayPaymentProvider", () => {
  const ProviderService = require("../providers/wooshpay-provider")
  const Provider = (ProviderService.default ?? ProviderService).services[0]

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it("includes return_url when creating a checkout session", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        id: "cs_test",
        url: "https://checkout.wooshpay.test/pay/cs_test",
        status: "open",
      }),
    } as Response)
    const provider = new Provider({
      payment_settings: {
        listPaymentProviderSettings: jest.fn().mockResolvedValue([
          {
            api_key: "sk_test",
            sandbox_mode: true,
          },
        ]),
      },
    })
    const successUrl = "https://store.test/zh-TW/checkout/return?cart_id=cart_test"
    const returnUrl = "https://store.test/zh-TW/checkout/return?cart_id=cart_test&source=return"
    const cancelUrl = "https://store.test/zh-TW/checkout/return?cart_id=cart_test&status=cancelled"

    await provider.initiatePayment({
      amount: 1234,
      currency_code: "gbp",
      data: {
        success_url: successUrl,
        return_url: returnUrl,
        cancel_url: cancelUrl,
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
      return_url: returnUrl,
      cancel_url: cancelUrl,
    })
  })
})
