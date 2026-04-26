import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // Image optimisation
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Reduce bundle size — externalize heavy packages from server bundles
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
