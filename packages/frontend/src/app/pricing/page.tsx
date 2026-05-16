import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/navigation/site-header'
import { GradientText } from '@/components/ui/gradient-text'
import { GradientButton } from '@/components/ui/gradient-button'
import { GlassCard } from '@/components/ui/glass-card'
import {
  Check,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Shield,
  Clock,
  Terminal,
  Package,
  ArrowRight,
  Star,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing | OpenConductor',
  description: 'Simple, transparent pricing for MCP server registry and telemetry. Start free, scale as you grow.',
}

// Registry tiers for server listings
const registryTiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'List your MCP server',
    features: [
      'Basic listing in registry',
      'Searchable by name/category',
      'Install via CLI',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/submit',
    highlighted: false,
  },
  {
    id: 'PRO_SERVER',
    name: 'Pro',
    price: 29,
    description: 'Stand out from the crowd',
    features: [
      'Verified badge on listing',
      'Priority in category results',
      'Basic install analytics',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    href: null,
    highlighted: false,
  },
  {
    id: 'FEATURED_SERVER',
    name: 'Featured',
    price: 99,
    description: 'Maximum visibility',
    features: [
      'Everything in Pro',
      'Top placement in search',
      'Homepage spotlight',
      'Full analytics dashboard',
      'Priority support',
    ],
    cta: 'Go Featured',
    href: null,
    highlighted: true,
    popular: true,
  },
]

// Telemetry tiers for SDK analytics
const telemetryTiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    events: '50,000',
    retention: '7 days',
    description: 'Get started with MCP telemetry',
    features: [
      'Basic dashboard',
      'Tool performance metrics',
      '1 API key',
      'Community support',
    ],
    cta: 'Start Free',
    href: 'https://github.com/openconductor/mcp-sdk',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    events: '500,000',
    retention: '90 days',
    description: 'For serious MCP developers',
    features: [
      'Advanced analytics',
      'Latency percentiles (p50/p95/p99)',
      '5 API keys',
      'Email alerts',
      'CSV exports',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    href: null,
    highlighted: true,
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    events: '5,000,000',
    retention: '1 year',
    description: 'For teams building with MCP',
    features: [
      'Everything in Pro',
      'Unlimited API keys',
      'Team members',
      'Slack integration',
      'Custom dashboards',
      'API access',
      'SLA guarantee',
    ],
    cta: 'Upgrade to Team',
    href: null,
    highlighted: false,
  },
]

function PricingCard({
  tier,
  category,
}: {
  tier: typeof registryTiers[0] | typeof telemetryTiers[0]
  category: 'registry' | 'telemetry'
}) {
  const isTelemetry = category === 'telemetry'
  const telemetryTier = tier as typeof telemetryTiers[0]

  return (
    <GlassCard
      className={`relative flex flex-col h-full ${
        tier.highlighted
          ? 'border-primary/50 bg-primary/5'
          : 'border-border/50'
      }`}
    >
      {'popular' in tier && tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white text-xs px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-1">
          {tier.name}
        </h3>
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-4xl font-bold text-foreground">
            ${tier.price}
          </span>
          <span className="text-foreground-secondary">/month</span>
        </div>
        <p className="text-sm text-foreground-secondary">{tier.description}</p>
      </div>

      {/* Telemetry-specific limits */}
      {isTelemetry && telemetryTier.events && (
        <div className="space-y-2 mb-6 pb-6 border-b border-border/50">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <strong>{telemetryTier.events}</strong> events/month
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <strong>{telemetryTier.retention}</strong> data retention
            </span>
          </div>
        </div>
      )}

      {/* Features */}
      <ul className="space-y-3 mb-6 flex-1">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <span className="text-foreground-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {tier.href ? (
        <Button
          asChild
          className={`w-full ${
            tier.highlighted
              ? 'bg-primary hover:bg-primary/90'
              : ''
          }`}
          variant={tier.highlighted ? 'default' : 'outline'}
        >
          <Link href={tier.href}>
            {tier.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button
          className={`w-full ${
            tier.highlighted
              ? 'bg-primary hover:bg-primary/90'
              : ''
          }`}
          variant={tier.highlighted ? 'default' : 'outline'}
          disabled
        >
          {tier.cta}
          <span className="ml-2 text-xs">(Coming Soon)</span>
        </Button>
      )}
    </GlassCard>
  )
}

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-4xl mx-auto">
            <Badge className="mb-8 text-sm px-4 py-2 rounded-full border-primary/30 bg-primary/10">
              <Sparkles className="h-3 w-3 mr-2 inline text-primary" />
              <span className="text-foreground-secondary">
                Simple pricing • No hidden fees
              </span>
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
              Plans that <GradientText>Scale with You</GradientText>
            </h1>

            <p className="text-lg md:text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
              Start free. Upgrade when you need more visibility for your servers
              or deeper analytics for your MCP integrations.
            </p>
          </div>
        </section>

        {/* Registry Pricing */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Server Registry</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <GradientText>Server Listings</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Get your MCP server discovered by thousands of developers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {registryTiers.map((tier) => (
              <PricingCard key={tier.id} tier={tier} category="registry" />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto border-t border-border/50" />
        </div>

        {/* Telemetry Pricing */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-4">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">SDK Telemetry</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <GradientText>MCP Analytics</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Understand how your MCP servers perform in production
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {telemetryTiers.map((tier) => (
              <PricingCard key={tier.id} tier={tier} category="telemetry" />
            ))}
          </div>
        </section>

        {/* Comparison Features */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why <GradientText>OpenConductor</GradientText>?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <GlassCard className="text-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Growing Ecosystem</h3>
                <p className="text-foreground-secondary text-sm">
                  220+ servers indexed. 1,000+ weekly downloads. Join the
                  fastest-growing MCP registry.
                </p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-success flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Enterprise Ready</h3>
                <p className="text-foreground-secondary text-sm">
                  SOC 2 compliance roadmap. Secure telemetry ingestion.
                  Built for production workloads.
                </p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Developer First</h3>
                <p className="text-foreground-secondary text-sm">
                  Open source CLI. Simple SDK integration. Built by developers,
                  for developers.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <GradientText>Questions?</GradientText>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <GlassCard>
              <h3 className="font-semibold text-lg mb-2">
                What's the difference between Registry and Telemetry?
              </h3>
              <p className="text-foreground-secondary text-sm">
                <strong>Registry</strong> is for listing your MCP server so
                developers can discover and install it. <strong>Telemetry</strong>{' '}
                is for monitoring how your MCP server performs in production with
                real-time analytics.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold text-lg mb-2">
                Can I use both products?
              </h3>
              <p className="text-foreground-secondary text-sm">
                Absolutely! Many server authors list their server in the registry
                AND use the SDK to monitor usage. The products work great together.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold text-lg mb-2">
                What happens if I exceed my event limit?
              </h3>
              <p className="text-foreground-secondary text-sm">
                We'll notify you when you're approaching your limit. Events above
                your limit are still collected but won't be displayed in your
                dashboard until you upgrade.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold text-lg mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-foreground-secondary text-sm">
                Yes! All paid plans are month-to-month with no long-term contracts.
                Cancel anytime and you'll retain access until the end of your
                billing period.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <GlassCard
            elevated
            className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-background to-primary/5"
          >
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to <GradientText>Get Started</GradientText>?
              </h2>
              <p className="text-foreground-secondary text-lg mb-8 max-w-2xl mx-auto">
                Join hundreds of developers building with MCP
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                  <Link href="/submit">
                    <Package className="mr-2 h-4 w-4" />
                    Submit Your Server
                  </Link>
                </GradientButton>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-12 border-primary/20 hover:border-primary/40"
                  asChild
                >
                  <a href="https://github.com/openconductor/mcp-sdk">
                    <Terminal className="mr-2 h-4 w-4" />
                    Try the SDK
                  </a>
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
                <li>
                  <Link href="/stacks" className="hover:text-foreground transition-colors">
                    Stacks
                  </Link>
                </li>
                <li>
                  <Link href="/discover" className="hover:text-foreground transition-colors">
                    Discover
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="hover:text-foreground transition-colors">
                    Submit Server
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://github.com/epicmotionSD/openconductor"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://modelcontextprotocol.io"
                    className="hover:text-foreground transition-colors"
                  >
                    MCP Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/openconductor/mcp-sdk"
                    className="hover:text-foreground transition-colors"
                  >
                    SDK Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://discord.gg/Ya5TPWeS"
                    className="hover:text-foreground transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/SDexecution"
                    className="hover:text-foreground transition-colors"
                  >
                    X/Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2024 OpenConductor. MIT Licensed. Built for the MCP community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
