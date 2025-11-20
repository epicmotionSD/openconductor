// import '../lib/tracing-web'  // Disabled due to XMLHttpRequest SSR errors
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.openconductor.ai'),
  title: {
    default: 'OpenConductor - MCP Server Registry',
    template: '%s | OpenConductor'
  },
  description: 'Discover, install, and manage Model Context Protocol (MCP) servers. The npm for AI agents, evolved for the ecosystem era.',
  keywords: ['MCP', 'Model Context Protocol', 'AI agents', 'server registry', 'developer tools', 'Vercel', 'Supabase', 'v0', 'BaseHub'],
  authors: [{ name: 'OpenConductor Team' }],
  creator: 'OpenConductor',
  publisher: 'OpenConductor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.openconductor.ai',
    title: 'OpenConductor - MCP Server Registry',
    description: 'Discover, install, and manage Model Context Protocol (MCP) servers for AI development',
    siteName: 'OpenConductor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenConductor - MCP Server Registry',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenConductor - MCP Server Registry',
    description: 'Discover, install, and manage Model Context Protocol (MCP) servers for AI development',
    images: ['/og-image.png'],
    creator: '@openconductor',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpenConductor" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}