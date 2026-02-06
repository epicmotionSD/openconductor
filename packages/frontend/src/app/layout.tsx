// import '../lib/tracing-web'  // Disabled due to XMLHttpRequest SSR errors
import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.openconductor.ai'),
  title: {
    default: 'OpenConductor - The Identity Layer for AI Agents',
    template: '%s | OpenConductor'
  },
  description: 'On-chain agent registration. Verifiable trust scores. EU AI Act compliance. The infrastructure that makes AI agents legal and insurable.',
  keywords: [
    'ai-agent-identity',
    'erc-8004',
    'agent-registry',
    'eu-ai-act',
    'ai-compliance',
    'trust-stack',
    'agent-attestation',
    'verifiable-agents',
    'ai-governance',
    'agent-insurance',
    'mcp',
    'model-context-protocol',
    'on-chain-agents',
    'base',
    'ethereum'
  ],
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
    title: 'OpenConductor - The Identity Layer for AI Agents',
    description: 'On-chain agent registration. Verifiable trust scores. EU AI Act compliance. The infrastructure that makes AI agents legal and insurable.',
    siteName: 'OpenConductor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenConductor Trust Stack - Identity Layer for AI Agents',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenConductor - The Identity Layer for AI Agents',
    description: 'On-chain agent identity. EU AI Act compliance. Make your AI agents legal and insurable.',
    images: ['/og-image.png'],
    creator: '@OpenConductor',
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
  themeColor: '#8B5CF6',
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
      <body className={`${inter.className} ${sora.variable} min-h-screen bg-background antialiased`}>
        {children}
      </body>
    </html>
  )
}
