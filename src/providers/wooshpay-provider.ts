import { AbstractPaymentProvider, PaymentSessionStatus } from "@medusajs/framework/utils"
import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import crypto from "crypto"

type WooShPayConfig = {
  api_key?: string | null
  webhook_secret?: string | null
  sandbox_mode?: boolean
}

type WooShPayObject = Record<string, any>

type WooShPaySessionData = {
  id: string
  checkout_session_id?: string
  payment_intent_id?: string
  url?: string
  redirect_url?: string
  amount: number
  currency: string
  raw?: unknown
}

const BASE_URL_TEST = "https://apitest.wooshpay.com"
const BASE_URL_PROD = "https://api.wooshpay.com"
const PROVIDER_ID = "pp_wooshpay_wooshpay"
const CACHE_TTL = 60_000

class WooShPayPaymentProvider extends AbstractPaymentProvider {
  static identifier = "wooshpay"
  private configCache = new Map<string, { ts: number; config: WooShPayConfig }>()

  private getBaseUrl(sandbox: boolean): string {
    return sandbox ? BASE_URL_TEST : BASE_URL_PROD
  }

  private async getConfig(): Promise<WooShPayConfig> {
    const cacheKey = "wooshpay"
    const cached = this.configCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.config

    try {
      const svc = (this.container as any).resolve("payment_settings")
      const settings = await svc.listPaymentProviderSettings(
        { provider_id: PROVIDER_ID }
      )
      const cfg: WooShPayConfig = {
        api_key: settings[0]?.api_key ?? null,
        webhook_secret: settings[0]?.webhook_secret ?? null,
        sandbox_mode: settings[0]?.sandbox_mode ?? true,
      }
      this.configCache.set(cacheKey, { ts: Date.now(), config: cfg })
      return cfg
    } catch {
      return { api_key: null, webhook_secret: null, sandbox_mode: true }
    }
  }

  private async request(path: string, method: string, body?: Record<string, unknown>): Promise<WooShPayObject> {
    const config = await this.getConfig()
    if (!config.api_key) {
      throw new Error("WooShPay API key is not configured for provider pp_wooshpay_wooshpay")
    }

    const baseUrl = this.getBaseUrl(config.sandbox_mode ?? true)
    const auth = Buffer.from(`${config.api_key}:`).toString("base64")

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await res.text()
    const parsed = text ? this.safeJsonParse(text) : {}

    if (!res.ok) {
      const details = typeof parsed === "string" ? parsed : JSON.stringify(parsed)
      throw new Error(`WooShPay API error ${res.status}: ${details}`)
    }

    return typeof parsed === "object" && parsed !== null ? parsed as WooShPayObject : {}
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  private toMinorUnits(amount: unknown): number {
    if (typeof amount === "number") return Math.round(amount)
    if (typeof amount === "string") return Math.round(Number(amount))
    if (amount && typeof amount === "object" && "value" in amount) {
      return Math.round(Number((amount as { value: unknown }).value))
    }

    return Math.round(Number(amount ?? 0))
  }

  private extractSessionId(input: { data?: Record<string, unknown>; context?: Record<string, unknown> }): string | undefined {
    const data = input.data ?? {}
    const context = input.context ?? {}
    const candidates = [
      data.session_id,
      data.payment_session_id,
      data.medusa_payment_session_id,
      context.session_id,
      context.payment_session_id,
      context.idempotency_key,
    ]

    return candidates.find((value): value is string => typeof value === "string" && value.length > 0)
  }

  private getReturnUrl(input: InitiatePaymentInput): string {
    const data = input.data ?? {}
    const configured = data.success_url ?? data.return_url ?? data.cancel_url
    if (typeof configured === "string" && configured.length > 0) return configured

    const storeCors = process.env.STORE_CORS?.split(",").map((url) => url.trim()).find(Boolean)
    if (storeCors) {
      try {
        const url = new URL(storeCors)
        if (url.pathname === "/") url.pathname = "/checkout"
        return url.toString()
      } catch {
        return storeCors
      }
    }

    return "http://localhost:8000/checkout"
  }

  private buildCheckoutPayload(input: InitiatePaymentInput): Record<string, unknown> {
    const amount = this.toMinorUnits(input.amount)
    const currency = input.currency_code.toUpperCase()
    const sessionId = this.extractSessionId(input)
    const returnUrl = this.getReturnUrl(input)
    const customerEmail = input.context?.customer?.email

    const metadata: Record<string, string> = {}
    if (sessionId) {
      metadata.session_id = sessionId
      metadata.medusa_payment_session_id = sessionId
    }

    return {
      mode: "payment",
      success_url: returnUrl,
      cancel_url: returnUrl,
      client_reference_id: sessionId,
      customer_email: customerEmail,
      metadata,
      payment_intent_data: {
        metadata,
      },
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: "Medusa order",
            },
          },
          quantity: 1,
        },
      ],
    }
  }

  private toSessionData(checkout: WooShPayObject, fallbackAmount: number, fallbackCurrency: string): WooShPaySessionData {
    const url = this.firstString(checkout.url, checkout.redirect_url)
    const paymentIntentId = this.firstString(
      checkout.payment_intent,
      checkout.payment_intent_id,
      checkout.payment_intent?.id
    )
    const amount = this.toMinorUnits(checkout.amount_total ?? checkout.amount ?? fallbackAmount)
    const currency = this.firstString(checkout.currency, fallbackCurrency)?.toLowerCase() ?? fallbackCurrency.toLowerCase()

    return {
      id: checkout.id,
      checkout_session_id: checkout.id,
      payment_intent_id: paymentIntentId,
      url,
      redirect_url: url,
      amount,
      currency,
      raw: checkout,
    }
  }

  private firstString(...values: unknown[]): string | undefined {
    return values.find((value): value is string => typeof value === "string" && value.length > 0)
  }

  private getPaymentIntentId(data?: Record<string, unknown>): string {
    return this.firstString(
      data?.payment_intent_id,
      data?.payment_intent,
      (data?.raw as WooShPayObject | undefined)?.payment_intent,
      (data?.raw as WooShPayObject | undefined)?.payment_intent?.id
    ) ?? ""
  }

  private getCheckoutSessionId(data?: Record<string, unknown>): string {
    const raw = data?.raw as WooShPayObject | undefined
    const dataId = this.firstString(data?.id)
    const rawId = this.firstString(raw?.id)

    return this.firstString(
      data?.checkout_session_id,
      raw?.checkout_session_id,
      raw?.object === "checkout.session" ? rawId : undefined,
      dataId?.startsWith("cs_") ? dataId : undefined,
      rawId?.startsWith("cs_") ? rawId : undefined
    ) ?? ""
  }

  private mapStatus(status?: unknown): PaymentSessionStatus {
    switch (String(status ?? "").toLowerCase()) {
      case "succeeded":
      case "paid":
      case "complete":
        return PaymentSessionStatus.CAPTURED
      case "requires_capture":
        return PaymentSessionStatus.AUTHORIZED
      case "canceled":
      case "cancelled":
      case "expired":
        return PaymentSessionStatus.CANCELED
      case "failed":
      case "payment_failed":
        return PaymentSessionStatus.ERROR
      case "processing":
      case "requires_payment_method":
      case "requires_confirmation":
      case "open":
      case "unpaid":
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const amount = this.toMinorUnits(input.amount)
    const currency = input.currency_code.toLowerCase()
    const result = await this.request("/v1/checkout/sessions", "POST", this.buildCheckoutPayload(input))
    const data = this.toSessionData(result, amount, currency)

    if (!data.url && !data.redirect_url) {
      throw new Error("WooShPay checkout session was created without a hosted checkout URL")
    }

    return {
      id: data.checkout_session_id ?? data.payment_intent_id ?? data.id,
      data: data as Record<string, unknown>,
      status: this.mapStatus(result.status ?? result.payment_status),
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const id = this.getPaymentIntentId(input.data)
    if (!id) return { data: input.data, status: PaymentSessionStatus.PENDING }

    const result = await this.request(`/v1/payment_intents/${id}`, "GET")
    return { data: { ...input.data, raw: result }, status: this.mapStatus(result.status) }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const id = this.getPaymentIntentId(input.data)
    if (!id) return { data: input.data }

    const result = await this.request(`/v1/payment_intents/${id}/capture`, "POST")
    return { data: { ...input.data, raw: result } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const id = this.getPaymentIntentId(input.data)
    if (!id) return { data: input.data }

    const result = await this.request(`/v1/payment_intents/${id}/cancel`, "POST")
    return { data: { ...input.data, raw: result } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const paymentIntentId = this.getPaymentIntentId(input.data)
    if (paymentIntentId) {
      const result = await this.request(`/v1/payment_intents/${paymentIntentId}`, "GET")
      return { data: { ...input.data, raw: result } }
    }

    const checkoutSessionId = this.getCheckoutSessionId(input.data)
    if (!checkoutSessionId) return { data: input.data }

    const result = await this.request(`/v1/checkout/sessions/${checkoutSessionId}`, "GET")
    return { data: { ...input.data, raw: result } }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = input.data ?? {}
    const amount = this.toMinorUnits(input.amount)
    const currency = input.currency_code.toLowerCase()

    return {
      data: {
        ...current,
        amount,
        currency,
      },
      status: this.mapStatus((current.raw as WooShPayObject | undefined)?.status ?? current.status),
    }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const paymentIntentId = this.getPaymentIntentId(input.data)
    if (paymentIntentId) {
      const result = await this.request(`/v1/payment_intents/${paymentIntentId}`, "GET")
      return { status: this.mapStatus(result.status), data: { ...input.data, raw: result } }
    }

    const checkoutSessionId = this.getCheckoutSessionId(input.data)
    if (!checkoutSessionId) return { status: this.mapStatus(input.data?.status) }

    const result = await this.request(`/v1/checkout/sessions/${checkoutSessionId}`, "GET")
    return {
      status: this.mapStatus(result.payment_status ?? result.status),
      data: { ...input.data, raw: result },
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload
    const config = await this.getConfig()

    if (config.webhook_secret && !this.verifyWebhookSignature(headers, rawData, config.webhook_secret)) {
      return { action: "failed" }
    }

    const event = (typeof data === "string" ? JSON.parse(data) : data) as WooShPayObject
    const object = (event?.data?.object ?? event?.data ?? event) as WooShPayObject
    const sessionId = this.extractWebhookSessionId(event, object)
    const amount = this.toMinorUnits(object.amount_received ?? object.amount ?? event.amount ?? 0)
    const actionData = sessionId ? { session_id: sessionId, amount } : undefined

    switch (event.type) {
      case "payment_intent.succeeded":
        return actionData ? { action: "captured", data: actionData } : { action: "not_supported" }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled":
      case "payment_intent.cancelled":
        return actionData ? { action: "failed", data: actionData } : { action: "not_supported" }
      default:
        return actionData ? { action: "not_supported", data: actionData } : { action: "not_supported" }
    }
  }

  private verifyWebhookSignature(
    headers: Record<string, unknown>,
    rawData: string | Buffer,
    secret: string
  ): boolean {
    const signatureHeader = this.getHeader(headers, "wooshpay-signature")
    if (!signatureHeader) return false

    const signatureParts = new Map(
      signatureHeader.split(",").map((part) => {
        const [key, ...rest] = part.split("=")
        return [key.trim(), rest.join("=").trim()]
      })
    )
    const timestamp = signatureParts.get("t")
    const signature = signatureParts.get("v1")
    if (!timestamp || !signature) return false

    const rawBody = Buffer.isBuffer(rawData) ? rawData.toString("utf8") : rawData
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex")

    return this.safeCompareHex(expected, signature)
  }

  private getHeader(headers: Record<string, unknown>, name: string): string | undefined {
    const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())
    const value = entry?.[1]
    if (Array.isArray(value)) return value.find((item): item is string => typeof item === "string")
    return typeof value === "string" ? value : undefined
  }

  private safeCompareHex(expected: string, received: string): boolean {
    try {
      const expectedBuffer = Buffer.from(expected, "hex")
      const receivedBuffer = Buffer.from(received, "hex")
      return expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    } catch {
      return false
    }
  }

  private extractWebhookSessionId(event: WooShPayObject, object: WooShPayObject): string {
    return this.firstString(
      object.metadata?.session_id,
      object.metadata?.medusa_payment_session_id,
      object.metadata?.payment_session_id,
      event.metadata?.session_id,
      event.metadata?.medusa_payment_session_id,
      event.client_reference_id,
      object.client_reference_id
    ) ?? ""
  }
}

const WooShPayProviderService = { services: [WooShPayPaymentProvider] }
export default WooShPayProviderService
module.exports = WooShPayProviderService
