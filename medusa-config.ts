import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim()
const sendgridFrom = process.env.SENDGRID_FROM?.trim()
const sendgridPasswordResetTemplateId =
  process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID?.trim()
const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com"
const smtpPort = process.env.SMTP_PORT?.trim() || "587"
const smtpSecure = process.env.SMTP_SECURE?.trim() || "false"
const smtpUser = process.env.SMTP_USER?.trim()
const smtpPass = process.env.SMTP_PASS?.trim()
const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser
const sendgridSettings = [
  sendgridApiKey,
  sendgridFrom,
  sendgridPasswordResetTemplateId,
]
const smtpSettings = [smtpUser, smtpPass, process.env.SMTP_FROM?.trim()]
const hasAnySendgridSetting = sendgridSettings.some(Boolean)
const hasCompleteSendgridSettings = sendgridSettings.every(Boolean)
const hasAnySmtpSetting = smtpSettings.some(Boolean)
const hasCompleteSmtpSettings = Boolean(smtpUser && smtpPass)

if (hasAnySmtpSetting && !hasCompleteSmtpSettings) {
  throw new Error(
    "SMTP_USER and SMTP_PASS must be configured together (SMTP_FROM is optional and defaults to SMTP_USER)"
  )
}

if (
  !hasCompleteSmtpSettings &&
  hasAnySendgridSetting &&
  !hasCompleteSendgridSettings
) {
  throw new Error(
    "SENDGRID_API_KEY, SENDGRID_FROM, and SENDGRID_PASSWORD_RESET_TEMPLATE_ID must be configured together"
  )
}

if (hasCompleteSmtpSettings && hasCompleteSendgridSettings) {
  throw new Error("Configure either Gmail SMTP or SendGrid, not both")
}

const emailNotificationProvider = hasCompleteSmtpSettings
  ? {
      resolve: "./src/providers/gmail-smtp",
      id: "gmail-smtp",
      options: {
        channels: ["email"],
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
      },
    }
  : hasCompleteSendgridSettings
  ? {
      resolve: "@medusajs/medusa/notification-sendgrid",
      id: "sendgrid",
      options: {
        channels: ["email"],
        api_key: sendgridApiKey,
        from: sendgridFrom,
      },
    }
  : {
      resolve: "@medusajs/medusa/notification-local",
      id: "local-email",
      options: {
        channels: ["email"],
      },
    }

module.exports = defineConfig({
  admin: {
    disable: true, // Disable built-in admin - we use custom admin-ui
  },
  modules: [
    {
      resolve: "./src/modules/brand",
    },
    {
      resolve: "./src/modules/tag",
    },
    {
      resolve: "./src/modules/announcement",
    },
    {
      resolve: "./src/modules/popup",
    },
    {
      resolve: "./src/modules/banner",
    },
    {
      resolve: "./src/modules/article",
    },
    {
      resolve: "./src/modules/curated-collection",
    },
    {
      resolve: "./src/modules/menu",
    },
    {
      resolve: "./src/modules/attribute-template",
    },
    {
      resolve: "./src/modules/wishlist",
    },
    {
      resolve: "./src/modules/restock-demand",
    },
    {
      resolve: "./src/modules/chat",
    },
    {
      resolve: "./src/modules/payment-settings",
    },
    {
      resolve: "./src/modules/pickup-location",
    },
    {
      resolve: "./src/modules/shipping-availability",
    },
    {
      resolve: "./src/modules/tracking",
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [emailNotificationProvider],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          ...(process.env.STRIPE_API_KEY ? [{
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          }] : []),
          ...(process.env.WOOSHPAY_ENABLED !== "false" ? [{
            resolve: "./src/providers/wooshpay-provider",
            id: "wooshpay",
            options: {},
          }] : []),
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/translation",
    },
  ],
  featureFlags: {
    translation: true,
  },
  projectConfig: {
    redisUrl: process.env.REDIS_URL,
    databaseUrl: process.env.DATABASE_URL,
    // Our compose PostgreSQL container doesn't expose TLS, so force plain TCP.
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
