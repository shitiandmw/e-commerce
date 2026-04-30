import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PAYMENT_SETTINGS_MODULE } from "../../../modules/payment-settings"
import PaymentSettingsService from "../../../modules/payment-settings/service"
import { updatePaymentSettingsWorkflow } from "../../../workflows/payment-settings/update-payment-settings"
import { PostAdminUpdatePaymentSettingsType } from "./validators"

function maskApiKey(key: string | null): { api_key_masked: string | null; is_api_key_set: boolean } {
  if (!key) return { api_key_masked: null, is_api_key_set: false }
  const visible = key.length > 4 ? `****${key.slice(-4)}` : "****"
  return { api_key_masked: visible, is_api_key_set: true }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc: PaymentSettingsService = req.scope.resolve(PAYMENT_SETTINGS_MODULE)
  const settings = await svc.listPaymentProviderSettings({}, { take: 50 })

  const safe = settings.map((s) => {
    const { api_key, webhook_secret, ...rest } = s
    return {
      ...rest,
      ...maskApiKey(api_key),
      webhook_secret_masked: webhook_secret ? "****" : null,
      is_webhook_secret_set: !!webhook_secret,
    }
  })

  res.json({ payment_settings: safe })
}

export const POST = async (req: MedusaRequest<PostAdminUpdatePaymentSettingsType>, res: MedusaResponse) => {
  const { result } = await updatePaymentSettingsWorkflow(req.scope).run({ input: req.validatedBody })
  const setting = result as Record<string, any>
  const { api_key, webhook_secret, ...rest } = setting
  res.json({
    payment_setting: {
      ...rest,
      ...maskApiKey(api_key),
      webhook_secret_masked: webhook_secret ? "****" : null,
      is_webhook_secret_set: !!webhook_secret,
    },
  })
}
