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
import { 
  ArrowRight, Terminal, Zap, Shield, Package, Github, 
  Search, Download, AlertTriangle, CheckCircle, Clock,
  FileCheck, Scale, Lock, Fingerprint, Building2
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section - Trust Stack Positioning */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Background gradient glow */}
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-5xl mx-auto">
            {/* 2026 Urgency Badge */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <Badge className="text-sm px-4 py-2 rounded-full border-warning/50 bg-warning/10 backdrop-blur-sm">
                <AlertTriangle className="h-3 w-3 mr-2 inline text-warning" />
                <span className="text-foreground-secondary">2026: EU AI Act enforced • NIST AI RMF required • Unregistered agents = Uninsurable</span>
              </Badge>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              The <GradientText>Trust Infrastructure</GradientText>
              <br />
              for AI Agents
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-foreground-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-foreground">Identity. Governance. Liability.</strong>
              <br />
              The rails that AI agents must run on to be legal and insurable.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                <Link href="/early-access">
                  <Shield className="mr-2 h-4 w-4" />
                  Join Early Access
                </Link>
              </GradientButton>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:border-primary/40" asChild>
                <Link href="/register">
                  Register Your Agent <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground-secondary">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-primary" />
                <span>ERC-8004 Identity</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <span>AP2 Policy Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-success" />
                <span>ISO 42001 Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-foreground" />
                <span>Insurance Partners</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The <GradientText>2026 Problem</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              AI agents are everywhere. But they have no identity, no guardrails, and no liability framework.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <GlassCard className="border-destructive/30 hover:border-destructive/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Identity</h3>
              <p className="text-foreground-secondary">
                Agents act anonymously. When something breaks, who's responsible? No audit trail, no accountability.
              </p>
            </GlassCard>

            <GlassCard className="border-destructive/30 hover:border-destructive/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Guardrails</h3>
              <p className="text-foreground-secondary">
                Agents do whatever they want. No policy enforcement, no boundaries, no compliance with regulations.
              </p>
            </GlassCard>

            <GlassCard className="border-destructive/30 hover:border-destructive/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Liability</h3>
              <p className="text-foreground-secondary">
                Agents can't be insured. When AI causes $10M in damages, insurers won't touch it.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Trust Stack Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24 bg-muted/20 py-16 rounded-3xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 border-primary/30">
              THE SOLUTION
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The <GradientText>Trust Stack</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Four layers that transform rogue AI into compliant, insurable infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Layer 1: Registry */}
            <GlassCard className="hover:border-success/50 transition-colors relative overflow-hidden">
              <Badge className="absolute top-4 right-4 bg-success/20 text-success border-success/30 text-xs">
                LIVE NOW
              </Badge>
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-purple">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Registry</h3>
              <p className="text-foreground-secondary text-sm mb-4">
                ERC-8004 identity standard. Every agent gets a verifiable on-chain identity.
              </p>
              <div className="text-xs text-foreground-secondary">
                <span className="text-success">✓</span> 220+ MCP servers indexed
              </div>
            </GlassCard>

            {/* Layer 2: Governor */}
            <GlassCard className="hover:border-primary/50 transition-colors relative overflow-hidden">
              <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border-primary/30 text-xs">
                Q2 2026
              </Badge>
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-blue">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Governor</h3>
              <p className="text-foreground-secondary text-sm mb-4">
                AP2 policy enforcement. PEP sidecars that ensure agents stay within bounds.
              </p>
              <div className="text-xs text-foreground-secondary">
                <span className="text-primary">◐</span> Policy engine in development
              </div>
            </GlassCard>

            {/* Layer 3: Underwriter */}
            <GlassCard className="hover:border-primary/50 transition-colors relative overflow-hidden">
              <Badge className="absolute top-4 right-4 bg-muted text-foreground-secondary border-muted text-xs">
                Q3 2026
              </Badge>
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Underwriter</h3>
              <p className="text-foreground-secondary text-sm mb-4">
                Risk scoring and ISO 42001 compliance. Makes agents insurable.
              </p>
              <div className="text-xs text-foreground-secondary">
                <span className="text-muted-foreground">○</span> Insurance partnerships forming
              </div>
            </GlassCard>

            {/* Layer 4: Proof */}
            <GlassCard className="hover:border-success/50 transition-colors relative overflow-hidden">
              <Badge className="absolute top-4 right-4 bg-success/20 text-success border-success/30 text-xs">
                REFERENCE
              </Badge>
              <div className="h-12 w-12 rounded-lg bg-gradient-success flex items-center justify-center mb-4 shadow-glow-success">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Proof</h3>
              <p className="text-foreground-secondary text-sm mb-4">
                x3o.ai Command Center. Live implementation of the full Trust Stack.
              </p>
              <div className="text-xs text-foreground-secondary">
                <span className="text-success">✓</span> Production deployment
              </div>
            </GlassCard>
          </div>
        </section>

        {/* MCP Registry Section - Existing Functionality */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-3 py-1 text-xs bg-success/10 border-success/30">
              LAYER 1 • LIVE NOW
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              MCP Server <GradientText>Registry</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Start with identity. 220+ servers indexed and ready to register.
            </p>
          </div>

          {/* Try Now Hero - Instant Value */}
          <TryNowHero />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
            <GlassCard className="hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-purple">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">One Command</h3>
              <p className="text-foreground-secondary">
                Install curated stacks without JSON configuration. Works with Claude, Cursor, and more.
              </p>
            </GlassCard>

            <GlassCard className="hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow-blue">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">220+ Servers</h3>
              <p className="text-foreground-secondary">
                The largest registry of MCP servers. Search, discover, and install any tool.
              </p>
            </GlassCard>

            <GlassCard className="hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-success flex items-center justify-center mb-4 shadow-glow-success">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Trust Verified</h3>
              <p className="text-foreground-secondary">
                Every server validated. Reputation scores and compliance tracking built in.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Live Activity Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <GradientText>Live Network</GradientText> Activity
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Real-time installations and registrations across the Trust Stack
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <LiveActivityFeed />
          </div>
        </section>

        {/* Stacks Preview */}
        <StackPreview />

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>220+</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Servers Indexed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>1K+</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Weekly Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>4</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Trust Layers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>2026</GradientText>
              </div>
              <div className="text-foreground-secondary text-sm">Full Stack Launch</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <GlassCard elevated className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="p-8 md:p-12 text-center">
              <Badge className="mb-4 px-3 py-1 text-xs bg-warning/10 border-warning/30 text-warning">
                LIMITED TO 50 COMPANIES
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join the <GradientText>Founding Cohort</GradientText>
              </h2>
              <p className="text-foreground-secondary text-lg mb-8 max-w-2xl mx-auto">
                Early access to the Trust Stack. Shape the future of compliant AI infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                  <Link href="/early-access">
                    <Shield className="mr-2 h-4 w-4" />
                    Apply for Early Access
                  </Link>
                </GradientButton>
                <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:border-primary/40" asChild>
                  <Link href="/discover">
                    Browse Registry
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
                Trust infrastructure for AI agents. Identity, governance, and liability for the agentic era.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Trust Stack</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/discover" className="hover:text-foreground transition-colors">Registry</Link></li>
                <li><span className="text-muted-foreground/50">Governor (Coming Q2)</span></li>
                <li><span className="text-muted-foreground/50">Underwriter (Coming Q3)</span></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/epicmotionSD/openconductor" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="https://modelcontextprotocol.io" className="hover:text-foreground transition-colors">MCP Docs</a></li>
                <li><Link href="/submit" className="hover:text-foreground transition-colors">Submit Server</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/early-access" className="hover:text-foreground transition-colors">Early Access</Link></li>
                <li><a href="https://discord.gg/Ya5TPWeS" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="https://x.com/SDexecution" className="hover:text-foreground transition-colors">X/Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024-2026 OpenConductor. Building the trust computer for AI agents.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
