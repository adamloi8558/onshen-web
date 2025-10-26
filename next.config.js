/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // ⚠️ Temporarily ignore type errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Temporarily ignore eslint errors during build
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.adamloi.me"]
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-b24c104618264932a27b9455988b0fae.r2.dev',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig