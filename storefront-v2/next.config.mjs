/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", port: "" },
      { protocol: "http", hostname: "localhost", port: "9437" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
}

export default nextConfig
