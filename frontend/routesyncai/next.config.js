/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allows all hostnames
      },
    ],
  },
  // Add this proxy configuration
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://globalroute-navigator-backend.onrender.com/:path*",
      },
    ]
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude Prisma completely from the build
  webpack: (config) => {
    // This is needed for all Prisma-related imports to be excluded from the client bundle
    config.externals = [...(config.externals || []), 'prisma', '@prisma/client']
    return config
  },
  // Skip Clerk auth during build
  env: {
    SKIP_PRISMA_GENERATE: 'true',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_disable',
    CLERK_SECRET_KEY: 'sk_test_disable',
  }
}

module.exports = nextConfig 