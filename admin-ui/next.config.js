/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Medusa backend
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
}

module.exports = nextConfig
