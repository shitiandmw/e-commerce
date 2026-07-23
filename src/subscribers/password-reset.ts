import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

type PasswordResetEvent = {
  entity_id: string
  token: string
  actor_type: string
}

function getStorefrontUrl() {
  const configuredUrl = process.env.STOREFRONT_URL?.trim()
  if (configuredUrl) {
    return configuredUrl
  }

  const storeDomain = process.env.STORE_DOMAIN?.trim()
  if (storeDomain) {
    return /^https?:\/\//i.test(storeDomain)
      ? storeDomain
      : `https://${storeDomain}`
  }

  return "http://localhost:3000"
}

export function buildCustomerPasswordResetUrl(email: string, token: string) {
  const resetUrl = new URL("/reset-password", `${getStorefrontUrl().replace(/\/$/, "")}/`)
  resetUrl.searchParams.set("token", token)
  resetUrl.searchParams.set("email", email)
  return resetUrl.toString()
}

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  if (data.actor_type !== "customer") {
    return
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: data.entity_id,
    channel: "email",
    template:
      process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID?.trim() || "password-reset",
    data: {
      email: data.entity_id,
      reset_url: buildCustomerPasswordResetUrl(data.entity_id, data.token),
      expires_in_minutes: 15,
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
