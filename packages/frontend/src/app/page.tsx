import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SiteHeader } from '@/components/navigation/site-header'
import { ArrowRight, Terminal } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section - Original Proven Copy + BaseHub Aesthetics */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          {/* Launch Badge */}
          <div className="flex justify-center mb-8">
            <Badge variant="outline" className="text-sm px-4 py-2 rounded-full">
              🚀 Launching Today - The npm for MCP Servers
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-foreground leading-tight">
            Discover & Install
            <br />
            MCP Servers in Seconds
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            OpenConductor is the missing registry and CLI for the Model Context Protocol.
            Find, install, and manage 60+ AI agent tools with professional developer experience.
            <br />
            <span className="text-muted-foreground/80">Works with modern stacks including Vercel, Supabase, and more.</span>
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-4 h-14">
              <Terminal className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-14" asChild>
              <Link href="/discover">
                Browse 60+ Servers <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Hero Demo */}
          <Card className="p-8 max-w-4xl mx-auto text-left mb-16">
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <Terminal className="h-5 w-5" />
              <span className="text-sm font-medium">Install any MCP server in 3 commands</span>
            </div>
            <div className="font-mono text-sm space-y-3">
              <div className="text-foreground">
                <span className="text-primary">$</span> npm install -g @openconductor/cli
              </div>
              <div className="text-foreground">
                <span className="text-primary">$</span> openconductor discover "memory"
              </div>
              <div className="text-foreground">
                <span className="text-primary">$</span> openconductor install openmemory
              </div>
              <div className="mt-6 space-y-2">
                <div className="text-success flex items-center gap-2">
                  <span>✓</span> Added to Claude Desktop config
                </div>
                <div className="text-success flex items-center gap-2">
                  <span>✓</span> Port allocated automatically
                </div>
                <div className="text-success flex items-center gap-2">
                  <span>✓</span> Ready to use in Claude!
                </div>
              </div>
            </div>
          </Card>

          {/* Launch Stats */}
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">60+</div>
              <div className="text-muted-foreground">MCP Servers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">3 Seconds</div>
              <div className="text-muted-foreground">Average Install</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Cross-Platform</div>
              <div className="text-muted-foreground">macOS, Windows, Linux</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Open Source</div>
              <div className="text-muted-foreground">MIT Licensed</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 OpenConductor. MIT Licensed. Built for the MCP community.</p>
        </div>
      </footer>
    </div>
  )
}