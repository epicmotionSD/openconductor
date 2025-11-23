// import '../lib/tracing-web'  // Disabled due to XMLHttpRequest SSR errors
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.openconductor.ai'),
  title: {
    default: 'OpenConductor - The npm for AI agent tools',
    template: '%s | OpenConductor'
  },
  description: 'Install MCP servers without the JSON hell. Discover and install 190+ AI agent tools with one command. Free, open source, and built for developers.',
  keywords: ['mcp', 'model-context-protocol', 'claude', 'ai-agents', 'package-manager', 'cli', 'developer-tools', 'ai', 'anthropic', 'ai-tools', 'mcp-server', 'mcp-registry', 'claude-desktop', 'json-config', 'stacks'],
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
    title: 'OpenConductor - The npm for AI agent tools',
    description: 'Install MCP servers without the JSON hell. 190+ servers, one command. Includes stacks, badges, and achievements.',
    siteName: 'OpenConductor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenConductor - The npm for AI agent tools',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenConductor - The npm for AI agent tools',
    description: 'Install MCP servers without the JSON hell. 190+ servers, one command.',
    images: ['/og-image.png'],
    creator: '@SDexecution',
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
  themeColor: '#8B5CF6', // OpenConductor brand purple
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpenConductor" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        {children}
      </body>
    </html>
  )
}