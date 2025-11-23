import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SiteHeader } from '@/components/navigation/site-header'
import { TryNowHero } from '@/components/homepage/try-now-hero'
import { StackPreview } from '@/components/homepage/stack-preview'
import { LiveActivityFeed } from '@/components/homepage/live-activity-feed'
import { GradientText } from '@/components/ui/gradient-text'
import { GradientButton } from '@/components/ui/gradient-button'
import { GlassCard } from '@/components/ui/glass-card'
import { ArrowRight, Terminal, Zap, Shield, Package, Github, Search, Download } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Background gradient glow */}
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-5xl mx-auto">
            {/* Launch Badge */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <Badge className="text-sm px-4 py-2 rounded-full border-primary/30 bg-primary/10 backdrop-blur-sm">
                <Zap className="h-3 w-3 mr-2 inline text-primary" />
                <span className="text-foreground-secondary">220+ Servers • 3 Stacks • Growing Daily</span>
              </Badge>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              Set up Claude for
              <br />
              <GradientText>Coding/Writing/Data</GradientText>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl text-foreground-secondary">in 10 seconds</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-foreground-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Pre-configured <strong className="text-foreground">Stacks</strong> with system prompts.
              One command installs all tools + gives Claude a specialized persona.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                <Link href="/install">
                  <Terminal className="mr-2 h-4 w-4" />
                  Install a Stack (10s)
                </Link>
              </GradientButton>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:border-primary/40" asChild>
                <Link href="/discover">
                  Browse 220+ Servers <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Try Now Hero - Instant Value */}
            <TryNowHero />

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground-secondary">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>220+ Servers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>3 Stacks</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                <span>MIT Licensed</span>
              </div>
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-foreground" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <GradientText>OpenConductor</GradientText>?
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Built for developers who want a seamless experience managing MCP servers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <GlassCard className="hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-purple">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Instant Value</h3>
              <p className="text-foreground-secondary">
                Install curated stacks with system prompts. Claude becomes a specialized assistant in 10 seconds.
              </p>
            </GlassCard>

            <GlassCard className="hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-blue">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">220+ Servers</h3>
              <p className="text-foreground-secondary">
                Access the largest registry of MCP servers. Search, discover, and install any tool you need.
              </p>
            </GlassCard>

            <GlassCard className="hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-success flex items-center justify-center mb-4 shadow-glow-success">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Verified Quality</h3>
              <p className="text-foreground-secondary">
                All servers validated with automated testing. Stacks curated by experts for best practices.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Live Activity Section - Social Proof */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join <GradientText>Developers Worldwide</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              See what's happening right now on OpenConductor
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LiveActivityFeed />
          </div>
        </section>

        {/* Stacks Section - Interactive Preview */}
        <StackPreview />

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>220+</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">MCP Servers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>3</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Curated Stacks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>10s</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Setup Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>MIT</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Open Source</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <GlassCard elevated className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to <GradientText>get started</GradientText>?
              </h2>
              <p className="text-foreground-secondary text-lg mb-8 max-w-2xl mx-auto">
                Join developers using OpenConductor to supercharge their AI workflows
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                  <Link href="/install">
                    <Terminal className="mr-2 h-4 w-4" />
                    Install a Stack (10s)
                  </Link>
                </GradientButton>
                <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:border-primary/40" asChild>
                  <Link href="/submit">
                    Submit Your Server
                  </Link>
                </Button>
              </div>
            </div>
          </GlassCard>
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