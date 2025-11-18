import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SiteHeader } from '@/components/navigation/site-header'
import { ArrowRight, Terminal, Zap, Shield, Package, Github, Search, Download } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="text-center max-w-5xl mx-auto">
            {/* Launch Badge */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <Badge variant="outline" className="text-sm px-4 py-2 rounded-full border-primary/20 bg-primary/5">
                <Zap className="h-3 w-3 mr-2 inline" />
                The npm registry for Model Context Protocol
              </Badge>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              Discover & Install
              <br />
              <span className="text-primary">MCP Servers</span> in Seconds
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The missing registry and CLI for the Model Context Protocol.
              Find, install, and manage AI agent tools with a professional developer experience.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Terminal className="mr-2 h-4 w-4" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                <Link href="/discover">
                  Browse Servers <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>60+ Servers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>MIT Licensed</span>
              </div>
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </section>

        {/* Terminal Demo Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <Card className="max-w-4xl mx-auto shadow-2xl border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 border-b flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                <span className="font-medium">Install any MCP server in seconds</span>
              </div>
            </div>
            <CardContent className="p-0 bg-slate-950">
              <img
                src="/demo/openconductor-demo.gif"
                alt="OpenConductor CLI demo showing installation and setup process"
                className="w-full h-auto"
                loading="lazy"
              />
            </CardContent>
          </Card>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why OpenConductor?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for developers who want a seamless experience managing MCP servers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Discover Easily</h3>
                <p className="text-muted-foreground">
                  Search through 60+ MCP servers with advanced filtering by category, tags, and popularity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Install Instantly</h3>
                <p className="text-muted-foreground">
                  One command to install and configure. Automatic Claude Desktop integration with zero manual setup.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Quality</h3>
                <p className="text-muted-foreground">
                  All servers are validated with automated testing. Community-driven with manual verification.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">60+</div>
                <div className="text-muted-foreground text-sm">MCP Servers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">&lt;3s</div>
                <div className="text-muted-foreground text-sm">Average Install</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">100%</div>
                <div className="text-muted-foreground text-sm">Cross-Platform</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">MIT</div>
                <div className="text-muted-foreground text-sm">Open Source</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join developers using OpenConductor to supercharge their AI workflows
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-base px-8 h-12">
                  <Terminal className="mr-2 h-4 w-4" />
                  Install CLI
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                  <Link href="/submit">
                    Submit Your Server
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">OpenConductor</h3>
              <p className="text-sm text-muted-foreground">
                The npm registry for Model Context Protocol servers
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/discover" className="hover:text-foreground transition-colors">Discover</Link></li>
                <li><Link href="/submit" className="hover:text-foreground transition-colors">Submit Server</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/epicmotionSD/openconductor" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="https://modelcontextprotocol.io" className="hover:text-foreground transition-colors">MCP Docs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://discord.gg/Ya5TPWeS" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="https://x.com/SDexecution" className="hover:text-foreground transition-colors">X/Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 OpenConductor. MIT Licensed. Built for the MCP community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}