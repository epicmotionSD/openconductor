// import '../lib/tracing-web'  // Disabled due to XMLHttpRequest SSR errors
import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.openconductor.ai'),
  title: {
    default: 'OpenConductor | The Identity & Compliance Layer for AI Agents (ERC-8004)',
    template: '%s | OpenConductor'
  },
  description: 'OpenConductor provides the Trust Stack for AI agents: on-chain identity via ERC-8004, EU AI Act compliance, and risk scoring for insurable AI infrastructure.',
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
  alternates: {
    canonical: 'https://www.openconductor.ai',
  },
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
    title: 'OpenConductor | The Identity & Compliance Layer for AI Agents (ERC-8004)',
    description: 'OpenConductor provides the Trust Stack for AI agents: on-chain identity via ERC-8004, EU AI Act compliance, and risk scoring for insurable AI infrastructure.',
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
    title: 'OpenConductor | The Identity & Compliance Layer for AI Agents (ERC-8004)',
    description: 'OpenConductor provides the Trust Stack for AI agents: on-chain identity via ERC-8004, EU AI Act compliance, and risk scoring for insurable AI infrastructure.',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "OpenConductor Trust Stack",
              "url": "https://www.openconductor.ai",
              "description": "OpenConductor provides the Trust Stack for AI agents: on-chain identity via ERC-8004, EU AI Act compliance, and risk scoring for insurable AI infrastructure.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Blockchain / Web",
              "featureList": [
                "ERC-8004 Agent Registry",
                "Policy Engine (Governor)",
                "Risk Scoring (Underwriter)",
                "EU AI Act Compliance"
              ],
              "creator": {
                "@type": "Organization",
                "name": "OpenConductor",
                "url": "https://www.openconductor.ai"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Open-source Trust Stack for AI agent identity and compliance"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} ${sora.variable} min-h-screen bg-background antialiased`}>
        {children}
      </body>
    </html>
  )
}
