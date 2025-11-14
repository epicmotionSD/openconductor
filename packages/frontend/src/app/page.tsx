import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, Zap, Shield, Users, Star, Download, Menu } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header - BaseHub Style */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-gray-900" />
            <span className="text-2xl font-bold text-gray-900">OpenConductor</span>
          </div>
          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="/discover" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Discover
            </Link>
            <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Docs
            </Link>
            <a href="https://github.com/epicmotionSD/openconductor" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              GitHub
            </a>
          </nav>
          <button className="md:hidden">
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Hero Section - Original Proven Copy + BaseHub Aesthetics */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          {/* Launch Badge - Proven Winner */}
          <div className="flex justify-center mb-8">
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-sm px-4 py-2 rounded-full">
              🚀 Launching Today - The npm for MCP Servers
            </Badge>
          </div>

          {/* Winning H1 */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 text-gray-900 leading-tight">
            Discover & Install
            <br />
            MCP Servers in Seconds
          </h1>
          
          {/* Enhanced Description with Subtle Ecosystem Hints */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            OpenConductor is the missing registry and CLI for the Model Context Protocol. 
            Find, install, and manage 60+ AI agent tools with professional developer experience.
            <br />
            <span className="text-gray-500">Works with modern stacks including Vercel, Supabase, and more.</span>
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-lg px-8 py-4 h-14 text-white">
              <Terminal className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-14 border-2 border-gray-200 hover:border-gray-300" asChild>
              <Link href="/discover">
                Browse 60+ Servers <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Hero Demo - The Strongest Selling Point */}
          <div className="bg-gray-50 rounded-xl p-8 max-w-4xl mx-auto text-left border border-gray-200 mb-16">
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <Terminal className="h-5 w-5" />
              <span className="text-sm font-medium">Install any MCP server in 3 commands</span>
            </div>
            <div className="font-mono text-sm space-y-3">
              <div className="text-gray-800">
                <span className="text-blue-600">$</span> npm install -g @openconductor/cli
              </div>
              <div className="text-gray-800">
                <span className="text-blue-600">$</span> openconductor discover "memory"
              </div>
              <div className="text-gray-800">
                <span className="text-blue-600">$</span> openconductor install openmemory
              </div>
              <div className="mt-6 space-y-2">
                <div className="text-green-600 flex items-center gap-2">
                  <span>✓</span> Added to Claude Desktop config
                </div>
                <div className="text-green-600 flex items-center gap-2">
                  <span>✓</span> Port allocated automatically
                </div>
                <div className="text-green-600 flex items-center gap-2">
                  <span>✓</span> Ready to use in Claude!
                </div>
              </div>
            </div>
          </div>

          {/* Launch Stats - Concrete Proof */}
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">60+</div>
              <div className="text-gray-600">MCP Servers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">3 Seconds</div>
              <div className="text-gray-600">Average Install</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">Cross-Platform</div>
              <div className="text-gray-600">macOS, Windows, Linux</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">Open Source</div>
              <div className="text-gray-600">MIT Licensed</div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. MIT Licensed. Built for the MCP community.</p>
        </div>
      </footer>
    </div>
  )
}