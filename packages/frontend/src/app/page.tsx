import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/navigation/site-header'
import { SiteFooter } from '@/components/navigation/site-footer'
import { GradientText } from '@/components/ui/gradient-text'
import { GradientButton } from '@/components/ui/gradient-button'
import { GlassCard } from '@/components/ui/glass-card'
import {
  ArrowRight, Shield, AlertTriangle, CheckCircle,
  FileCheck, Scale, Fingerprint, Building2, ExternalLink,
  Users, Globe, Cpu, Lock, FileWarning, Gavel
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-5xl mx-auto">
            {/* Regulatory Urgency */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <Badge className="text-sm px-4 py-2 rounded-full border-warning/50 bg-warning/10 backdrop-blur-sm">
                <AlertTriangle className="h-3 w-3 mr-2 inline text-warning" />
                <span className="text-foreground-secondary">EU AI Act enforcement begins August 2026</span>
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              Your AI Agents Need
              <br />
              <GradientText>An Identity</GradientText>
            </h1>

            {/* Value Prop */}
            <p className="text-xl md:text-2xl text-foreground-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
              On-chain registration. Verifiable trust scores. Compliance-ready.
              <br />
              <span className="text-foreground">The infrastructure that makes AI agents legal and insurable.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <GradientButton size="lg" glow className="text-base px-8 h-14 text-lg" asChild>
                <Link href="/register">
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Register an Agent
                </Link>
              </GradientButton>
              <Button size="lg" variant="outline" className="text-base px-8 h-14 text-lg border-primary/20 hover:border-primary/40" asChild>
                <Link href="/early-access">
                  Enterprise Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Live Contract Proof */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-success/10 border border-success/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-sm text-foreground-secondary">Live on Base</span>
              <a
                href="https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View Contract <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
                AI Agents Are <GradientText>Everywhere</GradientText>
              </h2>
              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                But they operate in a legal gray zone. No identity. No accountability. No insurance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <GlassCard className="border-destructive/30">
                <FileWarning className="h-10 w-10 text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Regulatory Risk</h3>
                <p className="text-foreground-secondary">
                  EU AI Act requires high-risk AI systems to be traceable. Violations: up to €35M or 7% global revenue.
                </p>
              </GlassCard>

              <GlassCard className="border-destructive/30">
                <Gavel className="h-10 w-10 text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Liability Exposure</h3>
                <p className="text-foreground-secondary">
                  When an agent causes damage, who pays? Without identity, there is no chain of custody.
                </p>
              </GlassCard>

              <GlassCard className="border-destructive/30">
                <Lock className="h-10 w-10 text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Uninsurable</h3>
                <p className="text-foreground-secondary">
                  Insurers will not cover anonymous AI. No identity means no policy and unlimited exposure.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* The Solution: Trust Stack */}
        <section className="bg-muted/30 py-16 md:py-24" id="trust-stack">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <Badge className="mb-4 px-3 py-1 text-xs bg-primary/10 border-primary/30">
                  THE SOLUTION
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  The <GradientText>Trust Stack</GradientText>
                </h2>
                <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                  Four layers that transform rogue AI into compliant, insurable infrastructure
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Layer 1 */}
                <GlassCard className="relative overflow-hidden border-success/50" id="registry">
                  <Badge className="absolute top-4 right-4 bg-success/20 text-success border-success/30">
                    LIVE NOW
                  </Badge>
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Layer 1: Registry</h3>
                      <p className="text-foreground-secondary mb-4">
                        ERC-8004 identity standard. Every agent gets an on-chain identity with verifiable metadata, ownership, and attestations.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>On-chain agent registration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>Third-party attestations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>GraphQL API via The Graph</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                {/* Layer 2 */}
                <GlassCard className="relative overflow-hidden" id="governor">
                  <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border-primary/30">
                    Q2 2026
                  </Badge>
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Scale className="h-7 w-7 text-foreground-secondary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Layer 2: Governor</h3>
                      <p className="text-foreground-secondary mb-4">
                        AP2 policy engine. Define what agents can and cannot do. Enforce boundaries before violations happen.
                      </p>
                      <ul className="space-y-2 text-sm text-foreground-secondary">
                        <li className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                          <span>Policy enforcement points</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                          <span>Permission management</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                          <span>Audit logging</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                {/* Layer 3 */}
                <GlassCard className="relative overflow-hidden" id="underwriter">
                  <Badge className="absolute top-4 right-4 bg-muted text-foreground-secondary border-muted">
                    Q3 2026
                  </Badge>
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-7 w-7 text-foreground-secondary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Layer 3: Underwriter</h3>
                      <p className="text-foreground-secondary mb-4">
                        Risk scoring and compliance certification. ISO 42001 alignment. The data insurers need.
                      </p>
                      <ul className="space-y-2 text-sm text-foreground-secondary">
                        <li className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                          <span>Trust score computation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                          <span>ISO 42001 compliance</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                          <span>Insurance API</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>

                {/* Layer 4 */}
                <GlassCard className="relative overflow-hidden border-success/50" id="proof">
                  <Badge className="absolute top-4 right-4 bg-success/20 text-success border-success/30">
                    REFERENCE
                  </Badge>
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-success flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Layer 4: Proof</h3>
                      <p className="text-foreground-secondary mb-4">
                        x3o.ai Command Center. A production implementation showing the full Trust Stack in action.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>Multi-agent orchestration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>Real-time monitoring</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>Enterprise dashboard</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Learn More Link */}
              <div className="text-center mt-12">
                <Link
                  href="/trust-stack"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Deep dive into the Trust Stack
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for <GradientText>Enterprise</GradientText>
              </h2>
              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                If you are deploying AI agents at scale, you need Trust Stack
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <GlassCard>
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-First Companies</h3>
                <p className="text-foreground-secondary">
                  Building products with AI agents? Register them before your competitors get regulated and you do not.
                </p>
              </GlassCard>

              <GlassCard>
                <Globe className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">EU Market Access</h3>
                <p className="text-foreground-secondary">
                  Selling into Europe? EU AI Act compliance is not optional. Trust Stack provides the audit trail.
                </p>
              </GlassCard>

              <GlassCard>
                <Cpu className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">MCP Developers</h3>
                <p className="text-foreground-secondary">
                  Building MCP servers? Register them with verifiable identity and build trust with enterprise buyers.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <GlassCard elevated className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <div className="p-8 md:p-12 text-center">
              <Badge className="mb-4 px-3 py-1 text-xs bg-warning/10 border-warning/30 text-warning">
                FOUNDING COHORT - 50 COMPANIES
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get <GradientText>Ahead of Regulation</GradientText>
              </h2>
              <p className="text-foreground-secondary text-lg mb-8 max-w-2xl mx-auto">
                Companies in the founding cohort get direct input on the Trust Stack roadmap, priority support, and locked-in pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton size="lg" glow className="text-base px-8 h-14 text-lg" asChild>
                  <Link href="/early-access">
                    <Shield className="mr-2 h-5 w-5" />
                    Apply for Early Access
                  </Link>
                </GradientButton>
                <Button size="lg" variant="outline" className="text-base px-8 h-14 text-lg border-primary/20 hover:border-primary/40" asChild>
                  <Link href="/register">
                    Register an Agent Now
                  </Link>
                </Button>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
