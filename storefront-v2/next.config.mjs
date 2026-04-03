import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowLocalIP: true,
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", port: "" },
      { protocol: "http", hostname: "localhost", port: "9437" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
}

export default withNextIntl(nextConfig)
