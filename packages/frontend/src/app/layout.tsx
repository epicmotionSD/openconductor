import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenConductor - The Control Plane for AI Agent Systems',
  description: 'Discover, orchestrate, and monitor MCP servers in production. The Kubernetes for AI agents.',
  keywords: ['AI', 'agents', 'MCP', 'Model Context Protocol', 'orchestration', 'Claude Desktop'],
  authors: [{ name: 'OpenConductor Team' }],
  openGraph: {
    title: 'OpenConductor - The Control Plane for AI Agent Systems',
    description: 'Discover, orchestrate, and monitor MCP servers in production.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}