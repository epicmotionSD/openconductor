import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenConductor - The npm for MCP Servers',
  description: 'Discover and install Model Context Protocol servers in seconds. Professional CLI for AI agent development.',
  keywords: ['MCP', 'Model Context Protocol', 'AI agents', 'Claude', 'CLI', 'developer tools', 'npm', 'registry'],
  authors: [{ name: 'OpenConductor', url: 'https://openconductor.ai' }],
  openGraph: {
    title: 'OpenConductor - The npm for MCP Servers',
    description: 'Discover and install Model Context Protocol servers in seconds',
    url: 'https://openconductor.ai',
    siteName: 'OpenConductor',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenConductor - The npm for MCP Servers',
    description: 'Discover and install Model Context Protocol servers in seconds',
    creator: '@OpenConductorAI',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DNFJ2ZT7FT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DNFJ2ZT7FT', {
              page_title: document.title,
              page_location: window.location.href,
              custom_map: {
                'dimension1': 'launch_week'
              }
            });
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}