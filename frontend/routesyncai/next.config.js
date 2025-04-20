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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // This is needed to completely ignore the Prisma modules during build
      config.externals.push('@prisma/client', 'prisma');
    }
    return config;
  }
}

module.exports = nextConfig 