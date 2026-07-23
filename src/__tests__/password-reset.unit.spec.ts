import { Modules } from "@medusajs/framework/utils"
import passwordResetHandler, {
  buildCustomerPasswordResetUrl,
  config,
} from "../subscribers/password-reset"

describe("customer password reset subscriber", () => {
  const originalStorefrontUrl = process.env.STOREFRONT_URL
  const originalStoreDomain = process.env.STORE_DOMAIN
  const originalTemplateId = process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID

  function restoreEnv(name: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = value
    }
  }

  afterEach(() => {
    restoreEnv("STOREFRONT_URL", originalStorefrontUrl)
    restoreEnv("STORE_DOMAIN", originalStoreDomain)
    restoreEnv("SENDGRID_PASSWORD_RESET_TEMPLATE_ID", originalTemplateId)
  })

  it("builds a storefront URL with encoded reset credentials", () => {
    process.env.STOREFRONT_URL = "https://store.example.com/"

    const url = new URL(
      buildCustomerPasswordResetUrl("customer+test@example.com", "token/with?symbols")
    )

    expect(url.origin).toBe("https://store.example.com")
    expect(url.pathname).toBe("/reset-password")
    expect(url.searchParams.get("email")).toBe("customer+test@example.com")
    expect(url.searchParams.get("token")).toBe("token/with?symbols")
  })

  it("sends customer reset events through the email notification provider", async () => {
    process.env.STOREFRONT_URL = "https://store.example.com"
    process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID = "d-password-reset"
    const createNotifications = jest.fn().mockResolvedValue(undefined)
    const resolve = jest.fn((key) => {
      if (key === Modules.NOTIFICATION) {
        return { createNotifications }
      }
      throw new Error(`Unexpected container key: ${String(key)}`)
    })

    await passwordResetHandler({
      event: {
        data: {
          entity_id: "customer@example.com",
          token: "reset-token",
          actor_type: "customer",
        },
      },
      container: { resolve },
    } as never)

    expect(createNotifications).toHaveBeenCalledWith({
      to: "customer@example.com",
      channel: "email",
      template: "d-password-reset",
      data: {
        email: "customer@example.com",
        reset_url:
          "https://store.example.com/reset-password?token=reset-token&email=customer%40example.com",
        expires_in_minutes: 15,
      },
    })
  })

  it("ignores password reset events for non-customer actors", async () => {
    const resolve = jest.fn()

    await passwordResetHandler({
      event: {
        data: {
          entity_id: "admin@example.com",
          token: "reset-token",
          actor_type: "user",
        },
      },
      container: { resolve },
    } as never)

    expect(resolve).not.toHaveBeenCalled()
  })

  it("subscribes to Medusa's password reset event", () => {
    expect(config.event).toBe("auth.password_reset")
  })
})
