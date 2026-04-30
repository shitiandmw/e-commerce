import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PAYMENT_SETTINGS_MODULE } from "../../../modules/payment-settings"
import PaymentSettingsService from "../../../modules/payment-settings/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc: PaymentSettingsService = req.scope.resolve(PAYMENT_SETTINGS_MODULE)
  const settings = await svc.listPaymentProviderSettings(
    { is_enabled: true },
    { select: ["id", "provider_id", "display_name", "description", "sandbox_mode", "metadata"], take: 50 }
  )

  const methods = settings.map((s) => ({
    provider_id: s.provider_id,
    display_name: s.display_name,
    description: s.description,
    sandbox_mode: s.sandbox_mode,
  }))

  res.json({ payment_methods: methods })
}
