/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@openconductor/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1',
  },
}

module.exports = nextConfig