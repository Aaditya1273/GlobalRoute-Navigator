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
  // Completely ignore all errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude Prisma from build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'prisma', '@prisma/client'];
    }
    return config;
  },
}

module.exports = nextConfig 