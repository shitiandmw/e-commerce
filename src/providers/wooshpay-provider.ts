import { AbstractPaymentProvider } from "@medusajs/framework/utils"
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
  PaymentSessionStatus,
} from "@medusajs/framework/types"
import crypto from "crypto"

type WooShPayConfig = {
  api_key?: string | null
  webhook_secret?: string | null
  sandbox_mode?: boolean
}

const BASE_URL_TEST = "https://apitest.wooshpay.com"
const BASE_URL_PROD = "https://api.wooshpay.com"
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
        { provider_id: "pp_wooshpay_wooshpay" }
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

  private async request(path: string, method: string, body?: Record<string, unknown>): Promise<any> {
    const config = await this.getConfig()
    if (!config.api_key) throw new Error("WooShPay API key not configured")
    const baseUrl = this.getBaseUrl(config.sandbox_mode ?? true)
    const auth = Buffer.from(`${config.api_key}:`).toString("base64")

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`WooShPay API error ${res.status}: ${text}`)
    }
    return res.json()
  }

  private mapStatus(status: string): PaymentSessionStatus {
    switch (status) {
      case "requires_payment_method": return "pending"
      case "requires_capture": return "authorized"
      case "succeeded": return "captured"
      case "canceled": return "canceled"
      default: return "pending"
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { amount, currency_code } = input
    const result = await this.request("/v1/payment_intents", "POST", {
      amount: Math.round(Number(amount)),
      currency: currency_code,
    })
    return { id: result.id, data: result as Record<string, unknown> }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const result = await this.request(`/v1/payment_intents/${id}`, "GET")
    return { data: result as Record<string, unknown>, status: this.mapStatus(result.status) }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const result = await this.request(`/v1/payment_intents/${id}/capture`, "POST")
    return { data: result as Record<string, unknown> }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const result = await this.request(`/v1/payment_intents/${id}/refund`, "POST")
    return { data: result as Record<string, unknown> }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const result = await this.request(`/v1/payment_intents/${id}/cancel`, "POST")
    return { data: result as Record<string, unknown> }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data as Record<string, unknown> }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const result = await this.request(`/v1/payment_intents/${id}`, "GET")
    return { data: result as Record<string, unknown> } as RetrievePaymentOutput
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const id = (input.data?.id as string) ?? ""
    const { amount, currency_code } = input
    const result = await this.request(`/v1/payment_intents/${id}`, "POST", {
      amount: Math.round(Number(amount)),
      currency: currency_code,
    })
    return { data: result as Record<string, unknown> }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const id = (input.data?.id as string) ?? ""
    const result = await this.request(`/v1/payment_intents/${id}`, "GET")
    return { status: this.mapStatus(result.status) }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload
    const config = await this.getConfig()

    if (config.webhook_secret) {
      const signature = (headers["wooshpay-signature"] as string) ?? ""
      const expected = crypto.createHmac("sha256", config.webhook_secret)
        .update(rawData as string).digest("hex")
      if (expected !== signature) {
        return { action: "failed", data: { session_id: "", amount: 0 } }
      }
    }

    const event = (typeof data === "string" ? JSON.parse(data) : data) as Record<string, unknown>
    const sessionId = ((event.metadata as any)?.session_id as string) ?? ""
    const amount = (event.amount as number) ?? 0

    switch (event.type) {
      case "payment_intent.succeeded":
        return { action: "captured", data: { session_id: sessionId, amount } }
      case "payment_intent.canceled":
        return { action: "failed", data: { session_id: sessionId, amount } }
      default:
        return { action: "not_supported", data: { session_id: sessionId, amount } }
    }
  }
}

const WooShPayProviderService = { services: [WooShPayPaymentProvider] }
export default WooShPayProviderService
module.exports = WooShPayProviderService
