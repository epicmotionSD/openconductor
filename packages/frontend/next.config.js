/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@openconductor/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002',
  },
  // PWA Configuration
  experimental: {
    webpackBuildWorker: true,
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig