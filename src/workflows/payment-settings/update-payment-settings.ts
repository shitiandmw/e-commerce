import { createStep, createWorkflow, WorkflowResponse, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYMENT_SETTINGS_MODULE } from "../../modules/payment-settings"
import PaymentSettingsService from "../../modules/payment-settings/service"

type UpdatePaymentSettingsInput = {
  provider_id: string
  is_enabled?: boolean
  display_name?: string
  description?: string
  sandbox_mode?: boolean
  api_key?: string
  webhook_secret?: string
}

const updatePaymentSettingsStep = createStep(
  "update-payment-settings-step",
  async (input: UpdatePaymentSettingsInput, { container }) => {
    const svc: PaymentSettingsService = container.resolve(PAYMENT_SETTINGS_MODULE)
    const existing = await svc.listPaymentProviderSettings({ provider_id: input.provider_id })

    // Skip api_key update if masked value sent
    const updateData = { ...input }
    if (updateData.api_key && updateData.api_key.startsWith("****")) {
      delete updateData.api_key
    }
    if (updateData.webhook_secret === "****") {
      delete updateData.webhook_secret
    }

    if (existing.length > 0) {
      const prev = existing[0]
      const updated = await svc.updatePaymentProviderSettings({ id: prev.id, ...updateData })
      return new StepResponse(updated, prev)
    }

    const created = await svc.createPaymentProviderSettings(updateData)
    return new StepResponse(created, null)
  },
  async (prev: any, { container }) => {
    if (!prev) return
    const svc: PaymentSettingsService = container.resolve(PAYMENT_SETTINGS_MODULE)
    await svc.updatePaymentProviderSettings(prev)
  }
)

export const updatePaymentSettingsWorkflow = createWorkflow(
  "update-payment-settings",
  (input: UpdatePaymentSettingsInput) => {
    const result = updatePaymentSettingsStep(input)
    return new WorkflowResponse(result)
  }
)
