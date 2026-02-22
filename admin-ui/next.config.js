const createNextIntlPlugin = require("next-intl/plugin")

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const medusaUrl = new URL(
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Allow images from Medusa backend
  images: {
    remotePatterns: [
      {
        protocol: medusaUrl.protocol.replace(":", ""),
        hostname: medusaUrl.hostname,
        port: medusaUrl.port,
      },
    ],
  },
}

module.exports = withNextIntl(nextConfig)
