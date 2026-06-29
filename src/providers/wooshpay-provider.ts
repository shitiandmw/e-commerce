import { AbstractPaymentProvider, MedusaError, PaymentSessionStatus } from "@medusajs/framework/utils"
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
import { Pool } from "pg"

type WooShPayConfig = {
  api_key?: string | null
  webhook_secret?: string | null
  sandbox_mode?: boolean
}

type WooShPayObject = Record<string, any>
type PaymentSettingsRow = {
  api_key?: string | null
  webhook_secret?: string | null
  sandbox_mode?: boolean | null
}

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

type WooShPayRequestOptions = {
  idempotencyKey?: string
}

type SafeWooShPayErrorDetails = {
  status?: number
  businessStatus?: string
  paymentStatus?: string
  code?: string
  errorType?: string
}

class WooShPayProviderError extends Error {
  status?: number
  businessStatus?: string
  paymentStatus?: string
  code?: string
  errorType?: string

  constructor(message: string, details: SafeWooShPayErrorDetails = {}) {
    super(message)
    this.name = "WooShPayProviderError"
    this.status = details.status
    this.businessStatus = details.businessStatus
    this.paymentStatus = details.paymentStatus
    this.code = details.code
    this.errorType = details.errorType
  }
}

const BASE_URL_TEST = "https://apitest.wooshpay.com"
const BASE_URL_PROD = "https://api.wooshpay.com"
const PROVIDER_ID = "pp_wooshpay_wooshpay"
const CACHE_TTL = 60_000
const IDEMPOTENCY_KEY_MAX_LENGTH = 255
let paymentSettingsPool: Pool | null = null

class WooShPayPaymentProvider extends AbstractPaymentProvider {
  static identifier = "wooshpay"
  private configCache = new Map<string, { ts: number; config: WooShPayConfig }>()

  private getBaseUrl(sandbox: boolean): string {
    return sandbox ? BASE_URL_TEST : BASE_URL_PROD
  }

  private getContainerValue<T = any>(key: string): T | undefined {
    try {
      return (this.container as any)[key] as T
    } catch {
      return undefined
    }
  }

  private async getConfigFromService(): Promise<WooShPayConfig | null> {
    const svc = this.getContainerValue("payment_settings")
    if (!svc?.listPaymentProviderSettings) return null

    const settings = await svc.listPaymentProviderSettings(
      { provider_id: PROVIDER_ID }
    )

    return settings[0] ? this.normalizeConfig(settings[0]) : null
  }

  private async getConfigFromManager(): Promise<WooShPayConfig | null> {
    const manager = this.getContainerValue("manager")
    if (!manager?.execute) return null

    const rows = await manager.execute(
      `
        SELECT api_key, webhook_secret, sandbox_mode
        FROM payment_provider_settings
        WHERE provider_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [PROVIDER_ID]
    ) as PaymentSettingsRow[]

    return rows?.[0] ? this.normalizeConfig(rows[0]) : null
  }

  private async getConfigFromDatabaseUrl(): Promise<WooShPayConfig | null> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) return null

    if (!paymentSettingsPool) {
      paymentSettingsPool = new Pool({
        connectionString: databaseUrl,
        ssl: false,
        max: 1,
      })
    }

    const result = await paymentSettingsPool.query<PaymentSettingsRow>(
      `
        SELECT api_key, webhook_secret, sandbox_mode
        FROM payment_provider_settings
        WHERE provider_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [PROVIDER_ID]
    )

    return result.rows?.[0] ? this.normalizeConfig(result.rows[0]) : null
  }

  private normalizeConfig(row?: PaymentSettingsRow | null): WooShPayConfig {
    return {
      api_key: row?.api_key ?? null,
      webhook_secret: row?.webhook_secret ?? null,
      sandbox_mode: row?.sandbox_mode ?? true,
    }
  }

  private hasStoredConfig(config: WooShPayConfig): boolean {
    return Boolean(config.api_key || config.webhook_secret)
  }

  private async getConfig(): Promise<WooShPayConfig> {
    const cacheKey = "wooshpay"
    const cached = this.configCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.config

    const loaders = [
      () => this.getConfigFromService(),
      () => this.getConfigFromManager(),
      () => this.getConfigFromDatabaseUrl(),
    ]

    for (const load of loaders) {
      try {
        const cfg = await load()
        if (cfg && this.hasStoredConfig(cfg)) {
          this.configCache.set(cacheKey, { ts: Date.now(), config: cfg })
          return cfg
        }
      } catch {
        // Try the next runtime config source.
      }
    }

    const empty = this.normalizeConfig()
    this.configCache.set(cacheKey, { ts: Date.now(), config: empty })
    return empty
  }

  private async request(
    path: string,
    method: string,
    body?: Record<string, unknown>,
    options: WooShPayRequestOptions = {}
  ): Promise<WooShPayObject> {
    const config = await this.getConfig()
    if (!config.api_key) {
      throw new WooShPayProviderError("WooShPay API key is not configured for provider pp_wooshpay_wooshpay", {
        code: "missing_api_key",
      })
    }

    const baseUrl = this.getBaseUrl(config.sandbox_mode ?? true)
    const auth = Buffer.from(`${config.api_key}:`).toString("base64")
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    }

    if (method.toUpperCase() === "POST" && options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await res.text()
    const parsed = text ? this.safeJsonParse(text) : {}

    if (!res.ok) {
      const details = this.getSafeApiErrorDetails(parsed)
      throw new WooShPayProviderError(
        `WooShPay API error ${res.status}: ${details.summary}`,
        {
          status: res.status,
          businessStatus: details.businessStatus,
          paymentStatus: details.paymentStatus,
          code: details.code,
          errorType: details.errorType,
        }
      )
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

  private getSafeApiErrorDetails(parsed: unknown): {
    summary: string
    businessStatus?: string
    paymentStatus?: string
    code?: string
    errorType?: string
  } {
    if (typeof parsed === "string") {
      return {
        summary: this.sanitizeDiagnostic(parsed) || "no safe error details returned",
      }
    }

    const body = this.asObject(parsed)
    const error = this.asObject(body?.error)
    const source = error ?? body
    const stringError = typeof body?.error === "string" ? body.error : undefined
    const code = this.sanitizeDiagnostic(this.firstString(
      source?.code,
      source?.decline_code,
      body?.code
    ) ?? "")
    const errorType = this.sanitizeDiagnostic(this.firstString(
      source?.type,
      source?.error_type,
      body?.type
    ) ?? "")
    const businessStatus = this.sanitizeDiagnostic(this.firstString(
      source?.status,
      body?.status
    ) ?? "")
    const paymentStatus = this.sanitizeDiagnostic(this.firstString(
      source?.payment_status,
      source?.paymentStatus,
      body?.payment_status,
      body?.paymentStatus
    ) ?? "")
    const message = this.sanitizeDiagnostic(this.firstString(
      source?.message,
      source?.error_description,
      source?.description,
      source?.detail,
      body?.message,
      stringError
    ) ?? "")
    const parts = [
      code ? `code=${code}` : undefined,
      errorType ? `type=${errorType}` : undefined,
      businessStatus ? `status=${businessStatus}` : undefined,
      paymentStatus ? `payment_status=${paymentStatus}` : undefined,
      message ? `message=${message}` : undefined,
    ].filter((part): part is string => Boolean(part))

    return {
      summary: parts.join(", ") || "no safe error details returned",
      businessStatus: businessStatus || undefined,
      paymentStatus: paymentStatus || undefined,
      code: code || undefined,
      errorType: errorType || undefined,
    }
  }

  private sanitizeDiagnostic(value: unknown, maxLength = 300): string {
    const normalized = String(value ?? "").replace(/\s+/g, " ").trim()
    if (!normalized) return ""

    const redacted = normalized
      .replace(/\b(sk|pk)_(test|live)_[A-Za-z0-9_:-]+\b/g, "$1_$2_[redacted]")
      .replace(/("(?=[^"]*(?:token|secret|api[-_]?key|authorization|password))[^"]*"\s*:\s*)"[^"]*"/gi, "$1\"[redacted]\"")
      .replace(/("(?=[^"]*(?:token|secret|api[-_]?key|authorization|password))[^"]*"\s*:\s*)([^,}\]\s]+)/gi, "$1\"[redacted]\"")
      .replace(/((?=[A-Za-z0-9_.-]*(?:token|secret|api[-_]?key|authorization|password))[A-Za-z0-9_.-]+\s*[:=]\s*)(?:"[^"]*"|'[^']*'|(?:Basic|Bearer)\s+[^\s,;}\]]+|[^\s,;}\]]+)/gi, "$1[redacted]")
      .replace(/\b(Basic|Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [redacted]")

    return redacted.length > maxLength ? `${redacted.slice(0, maxLength - 3)}...` : redacted
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

  private getStableIdempotencyKey(
    operation: string,
    input: { data?: Record<string, unknown>; context?: Record<string, unknown> },
    ...extraCandidates: unknown[]
  ): string | undefined {
    const data = input.data ?? {}
    const context = input.context ?? {}
    const raw = data.raw as WooShPayObject | undefined
    const base = this.firstString(
      context.idempotency_key,
      data.idempotency_key,
      ...extraCandidates,
      data.refund_id,
      data.payment_id,
      data.payment_session_id,
      data.session_id,
      data.medusa_payment_session_id,
      raw?.metadata?.medusa_payment_session_id,
      raw?.metadata?.session_id
    )

    if (!base) return undefined

    const key = `medusa-wooshpay-${operation}-${base}`
    return key.length > IDEMPOTENCY_KEY_MAX_LENGTH
      ? crypto.createHash("sha256").update(key).digest("hex")
      : key
  }

  private getRefundIdempotencyKey(input: RefundPaymentInput): string | undefined {
    const data = input.data ?? {}
    const context = input.context ?? {}
    const refundId = this.firstString(
      context.idempotency_key,
      data.idempotency_key,
      data.refund_id,
      (data.refund as WooShPayObject | undefined)?.id,
      data.provider_refund_id
    )

    return refundId ? this.getStableIdempotencyKey("refund", input, refundId) : undefined
  }

  private getReturnUrl(input: InitiatePaymentInput): string {
    const data = input.data ?? {}
    const configured = data.return_url ?? data.success_url ?? data.cancel_url
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

  private getCheckoutUrl(
    input: InitiatePaymentInput,
    key: "success_url" | "return_url" | "cancel_url",
    fallback: string
  ): string {
    const value = input.data?.[key]
    return typeof value === "string" && value.length > 0 ? value : fallback
  }

  private buildCheckoutPayload(input: InitiatePaymentInput): Record<string, unknown> {
    const amount = this.toMinorUnits(input.amount)
    const currency = input.currency_code.toUpperCase()
    const sessionId = this.extractSessionId(input)
    const returnUrl = this.getReturnUrl(input)
    const successUrl = this.getCheckoutUrl(input, "success_url", returnUrl)
    const cancelUrl = this.getCheckoutUrl(input, "cancel_url", returnUrl)
    const customerEmail = input.context?.customer?.email

    const metadata: Record<string, string> = {}
    if (sessionId) {
      metadata.session_id = sessionId
      metadata.medusa_payment_session_id = sessionId
    }

    return {
      mode: "payment",
      success_url: successUrl,
      return_url: returnUrl,
      cancel_url: cancelUrl,
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
    const paymentIntentId = this.getPaymentIntentId(checkout)
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

  private asObject(value: unknown): WooShPayObject | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as WooShPayObject
      : undefined
  }

  private firstPaymentIntentId(...values: unknown[]): string | undefined {
    return this.firstString(...values.filter((value) => {
      return typeof value === "string" && !value.startsWith("cs_")
    }))
  }

  private getPaymentIntentFromValue(value: unknown, allowObjectId = false): string | undefined {
    if (typeof value === "string") return this.firstPaymentIntentId(value)

    const object = this.asObject(value)
    if (!object) return undefined
    const objectId = this.firstString(object.id)
    const isPaymentIntentObject = ["payment_intent", "payment.intent"].includes(String(object.object ?? ""))

    return this.firstPaymentIntentId(
      allowObjectId || isPaymentIntentObject || objectId?.startsWith("pi_") ? objectId : undefined,
      object.payment_intent_id,
      object.paymentIntentId,
      this.getPaymentIntentFromValue(object.payment_intent, true),
      this.getPaymentIntentFromValue(object.paymentIntent, true),
      this.getPaymentIntentFromValue(object.intent, true),
      this.getPaymentIntentFromValue(object.intent_id, true)
    )
  }

  private getPaymentIntentFromObject(object?: WooShPayObject): string | undefined {
    if (!object) return undefined

    const payment = this.asObject(object.payment)
    const latestCharge = this.asObject(object.latest_charge)
    const directCharge = this.asObject(object.charge)
    const chargesValue = this.asObject(object.charges)?.data ?? object.charges
    const charges = Array.isArray(chargesValue)
      ? chargesValue.map((charge) => this.asObject(charge)).filter((charge): charge is WooShPayObject => Boolean(charge))
      : []

    return this.firstPaymentIntentId(
      typeof object.id === "string" && object.id.startsWith("pi_") ? object.id : undefined,
      object.object === "payment_intent" ? object.id : undefined,
      object.object === "payment.intent" ? object.id : undefined,
      this.getPaymentIntentFromValue(object.payment_intent_id),
      this.getPaymentIntentFromValue(object.paymentIntentId),
      this.getPaymentIntentFromValue(object.payment_intent, true),
      this.getPaymentIntentFromValue(object.paymentIntent, true),
      this.getPaymentIntentFromValue(object.payment_intent_data, true),
      this.getPaymentIntentFromValue(object.paymentIntentData, true),
      this.getPaymentIntentFromValue(object.intent, true),
      this.getPaymentIntentFromValue(object.intent_id, true),
      this.getPaymentIntentFromValue(payment?.payment_intent_id),
      this.getPaymentIntentFromValue(payment?.payment_intent, true),
      this.getPaymentIntentFromValue(payment?.paymentIntentId),
      this.getPaymentIntentFromValue(payment?.paymentIntent, true),
      this.getPaymentIntentFromValue(payment),
      this.getPaymentIntentFromValue(latestCharge?.payment_intent_id),
      this.getPaymentIntentFromValue(latestCharge?.payment_intent, true),
      this.getPaymentIntentFromValue(latestCharge?.paymentIntentId),
      this.getPaymentIntentFromValue(latestCharge?.paymentIntent, true),
      this.getPaymentIntentFromValue(directCharge?.payment_intent_id),
      this.getPaymentIntentFromValue(directCharge?.payment_intent, true),
      this.getPaymentIntentFromValue(directCharge?.paymentIntentId),
      this.getPaymentIntentFromValue(directCharge?.paymentIntent, true),
      ...charges.flatMap((charge) => [
        this.getPaymentIntentFromValue(charge.payment_intent_id),
        this.getPaymentIntentFromValue(charge.payment_intent, true),
        this.getPaymentIntentFromValue(charge.paymentIntentId),
        this.getPaymentIntentFromValue(charge.paymentIntent, true),
      ])
    )
  }

  private getPaymentIntentId(data?: Record<string, unknown>): string {
    const raw = this.asObject(data?.raw)

    return this.firstPaymentIntentId(
      this.getPaymentIntentFromObject(data),
      this.getPaymentIntentFromObject(raw)
    ) ?? ""
  }

  private getRefundPaymentIntentId(data?: Record<string, unknown>): string {
    return this.getPaymentIntentId(data)
  }

  private getCheckoutSessionId(data?: Record<string, unknown>): string {
    const raw = this.asObject(data?.raw)
    const dataCheckoutSession = this.asObject(data?.checkout_session) ?? this.asObject(data?.checkoutSession)
    const rawCheckoutSession = this.asObject(raw?.checkout_session) ?? this.asObject(raw?.checkoutSession)
    const dataId = this.firstString(data?.id)
    const rawId = this.firstString(raw?.id)
    const dataSessionId = this.firstString(data?.session_id)
    const rawSessionId = this.firstString(raw?.session_id)

    return this.firstString(
      data?.checkout_session_id,
      data?.checkoutSessionId,
      data?.checkout_session,
      data?.checkoutSession,
      dataCheckoutSession?.id,
      raw?.checkout_session_id,
      raw?.checkoutSessionId,
      raw?.checkout_session,
      raw?.checkoutSession,
      rawCheckoutSession?.id,
      raw?.object === "checkout.session" ? rawId : undefined,
      dataId?.startsWith("cs_") ? dataId : undefined,
      rawId?.startsWith("cs_") ? rawId : undefined,
      dataSessionId?.startsWith("cs_") ? dataSessionId : undefined,
      rawSessionId?.startsWith("cs_") ? rawSessionId : undefined
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

  private isTerminalSuccessStatus(data?: Record<string, unknown>): boolean {
    const raw = data?.raw as WooShPayObject | undefined
    const status = String(raw?.payment_status ?? raw?.status ?? data?.status ?? "").toLowerCase()
    return ["succeeded", "paid", "complete", "captured"].includes(status)
  }

  private isTerminalCancelError(error: unknown): boolean {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    return [
      "already succeeded",
      "already captured",
      "already canceled",
      "already cancelled",
      "already expired",
      "\"status\":\"succeeded\"",
      "status=succeeded",
      "\"status\":\"paid\"",
      "status=paid",
      "\"status\":\"complete\"",
      "status=complete",
      "\"status\":\"captured\"",
      "status=captured",
      "\"status\":\"canceled\"",
      "status=canceled",
      "\"status\":\"cancelled\"",
      "status=cancelled",
      "\"status\":\"expired\"",
      "status=expired",
    ].some((token) => message.includes(token))
  }

  private toRefundError(error: unknown): MedusaError {
    if (error instanceof MedusaError) return error

    const message = error instanceof Error
      ? this.sanitizeDiagnostic(error.message)
      : "Unknown WooShPay refund error"
    const fallback = "WooShPay refund failed"

    return new MedusaError(
      MedusaError.Types.INVALID_DATA,
      message ? `${fallback}: ${message}` : fallback
    )
  }

  private appendRefundData(data: Record<string, unknown> | undefined, refund: WooShPayObject): Record<string, unknown> {
    const current = data ?? {}
    const existingRefunds = Array.isArray(current.refunds) ? current.refunds : []

    return {
      ...current,
      refunds: [...existingRefunds, refund],
      last_refund_id: this.firstString(refund.id),
      raw_last_refund: refund,
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const amount = this.toMinorUnits(input.amount)
    const currency = input.currency_code.toLowerCase()
    const sessionId = this.extractSessionId(input)
    const result = await this.request(
      "/v1/checkout/sessions",
      "POST",
      this.buildCheckoutPayload(input),
      { idempotencyKey: this.getStableIdempotencyKey("checkout", input, sessionId) }
    )
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

    const result = await this.request(
      `/v1/payment_intents/${id}/capture`,
      "POST",
      undefined,
      { idempotencyKey: this.getStableIdempotencyKey("capture", input, id) }
    )
    return { data: { ...input.data, raw: result } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      let paymentIntentId = this.getRefundPaymentIntentId(input.data)
      let resolvedSession: WooShPayObject | undefined
      const checkoutSessionId = this.getCheckoutSessionId(input.data)

      if (!paymentIntentId && checkoutSessionId) {
        resolvedSession = await this.request(`/v1/checkout/sessions/${checkoutSessionId}`, "GET")
        paymentIntentId = this.getRefundPaymentIntentId({ raw: resolvedSession })
      }

      const amount = this.toMinorUnits(input.amount)

      if (!paymentIntentId) {
        throw new WooShPayProviderError(
          "WooShPay refund requires a payment_intent_id in provider data or retrievable checkout session",
          { code: "missing_payment_intent" }
        )
      }

      const result = await this.request(
        "/v1/refunds",
        "POST",
        {
          payment_intent: paymentIntentId,
          amount,
        },
        { idempotencyKey: this.getRefundIdempotencyKey(input) }
      )

      return {
        data: this.appendRefundData({
          ...input.data,
          payment_intent_id: input.data?.payment_intent_id ?? paymentIntentId,
          raw: input.data?.raw ?? resolvedSession,
        }, result),
      }
    } catch (error) {
      throw this.toRefundError(error)
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    if (this.isTerminalSuccessStatus(input.data)) {
      return { data: input.data }
    }

    const checkoutSessionId = this.getCheckoutSessionId(input.data)
    if (checkoutSessionId) {
      try {
        const result = await this.request(
          `/v1/checkout/sessions/${checkoutSessionId}/expire`,
          "POST",
          undefined,
          { idempotencyKey: this.getStableIdempotencyKey("cancel", input, checkoutSessionId) }
        )
        return { data: { ...input.data, raw: result } }
      } catch (error) {
        if (this.isTerminalCancelError(error)) return { data: input.data }
        throw error
      }
    }

    const id = this.getPaymentIntentId(input.data)
    if (!id) return { data: input.data }

    try {
      const result = await this.request(
        `/v1/payment_intents/${id}/cancel`,
        "POST",
        { cancellation_reason: "requested_by_customer" },
        { idempotencyKey: this.getStableIdempotencyKey("cancel", input, id) }
      )
      return { data: { ...input.data, raw: result } }
    } catch (error) {
      if (this.isTerminalCancelError(error)) return { data: input.data }
      throw error
    }
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
      case "checkout.session.expired":
      case "refund.created":
      case "refund.succeeded":
      case "refund.updated":
      case "refund.failed":
      case "charge.refunded":
      case "charge.dispute.created":
      case "charge.dispute.updated":
      case "charge.dispute.closed":
        return actionData ? { action: "not_supported", data: actionData } : { action: "not_supported" }
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
