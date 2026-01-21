// Force dynamic rendering - stacks API requires runtime fetch
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/navigation/site-header'
import { GradientText } from '@/components/ui/gradient-text'
import { GradientButton } from '@/components/ui/gradient-button'
import { GlassCard } from '@/components/ui/glass-card'
import {
  ArrowRight,
  Terminal,
  Zap,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Code,
  FileText,
  Layers,
  Download
} from 'lucide-react'

// Fetch stacks from API
async function getStacks() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

  try {
    const res = await fetch(`${apiUrl}/v1/stacks`, {
      cache: 'no-store'
    })

    if (!res.ok) {
      throw new Error('Failed to fetch stacks')
    }

    const data = await res.json()
    return data.data.stacks || []
  } catch (error) {
    console.error('Error fetching stacks:', error)
    return []
  }
}

// Fetch individual stack details
async function getStackDetails(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

  try {
    const res = await fetch(`${apiUrl}/v1/stacks/${slug}`, {
      cache: 'no-store'
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.data
  } catch (error) {
    console.error(`Error fetching stack ${slug}:`, error)
    return null
  }
}

export default async function StacksPage() {
  const stacks = await getStacks()

  // Fetch details for each stack in parallel
  const stacksWithDetails = await Promise.all(
    stacks.map(async (stack: any) => {
      const details = await getStackDetails(stack.slug)
      return {
        ...stack,
        servers: details?.servers || []
      }
    })
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Background gradient glow */}
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <Badge className="text-sm px-4 py-2 rounded-full border-primary/30 bg-primary/10 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-2 inline text-primary" />
                <span className="text-foreground-secondary">Pre-configured • Expert-curated • Production-ready</span>
              </Badge>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              AI Workflows in
              <br />
              <GradientText>10 Seconds</GradientText>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-foreground-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop configuring. Start building. Each stack includes <strong className="text-foreground">curated MCP servers + expert system prompts</strong> that turn Claude into a specialized assistant.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                <Link href="/install">
                  <Terminal className="mr-2 h-4 w-4" />
                  Install Your First Stack
                </Link>
              </GradientButton>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:border-primary/40" asChild>
                <a href="https://github.com/epicmotionSD/openconductor">
                  View on GitHub <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <GlassCard className="text-left border-destructive/30">
                <div className="flex items-start gap-3 mb-3">
                  <XCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Manual Setup</h3>
                    <ul className="space-y-2 text-sm text-foreground-secondary">
                      <li>• 15-30 min per server configuration</li>
                      <li>• JSON syntax errors and debugging</li>
                      <li>• Figuring out which servers to use</li>
                      <li>• Writing effective system prompts</li>
                      <li>• Trial and error with combinations</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="text-left border-success/30 bg-success/5">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">With Stacks</h3>
                    <ul className="space-y-2 text-sm text-foreground-secondary">
                      <li>• 10 seconds to install complete workflow</li>
                      <li>• Zero configuration required</li>
                      <li>• Expert-curated server combinations</li>
                      <li>• Production-tested system prompts</li>
                      <li>• Works perfectly out of the box</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-muted/30 border-y py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <GradientText>{stacks.length}</GradientText>
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
                  <GradientText>1</GradientText>
                </div>
                <div className="text-foreground-secondary text-sm">Command</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <GradientText>0</GradientText>
                </div>
                <div className="text-foreground-secondary text-sm">Config Files</div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Stacks */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Available <GradientText>Stacks</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Each stack is production-tested and designed for specific workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {stacksWithDetails.map((stack: any) => (
              <GlassCard key={stack.id} className="hover:border-primary/50 transition-all group">
                <div className="text-4xl mb-4">{stack.icon || '📦'}</div>
                <h3 className="text-2xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {stack.name}
                </h3>
                <p className="text-foreground-secondary mb-1 text-sm font-medium">{stack.tagline}</p>
                <p className="text-foreground-secondary mb-6">{stack.description}</p>

                {/* Server count */}
                <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-4 pb-4 border-b border-border/50">
                  <Package className="h-4 w-4 text-primary" />
                  <span>{stack.servers?.length || 0} servers included</span>
                </div>

                {/* Servers list */}
                {stack.servers && stack.servers.length > 0 && (
                  <div className="mb-6 space-y-2">
                    {stack.servers.slice(0, 5).map((server: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                        <span className="line-clamp-1">{server.name}</span>
                      </div>
                    ))}
                    {stack.servers.length > 5 && (
                      <div className="text-xs text-foreground-secondary/70 ml-5">
                        +{stack.servers.length - 5} more
                      </div>
                    )}
                  </div>
                )}

                {/* Install command */}
                <div className="mb-4">
                  <code className="text-xs bg-slate-950 text-slate-100 p-3 rounded block overflow-x-auto">
                    openconductor stack install {stack.slug}
                  </code>
                </div>

                {/* Install count */}
                {stack.install_count > 0 && (
                  <div className="text-xs text-foreground-secondary">
                    <Download className="h-3 w-3 inline mr-1" />
                    {stack.install_count.toLocaleString()} installs
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </section>

        {/* What's Included Section */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What's <GradientText>Included</GradientText>
              </h2>
              <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
                Every stack gives you production-ready capabilities immediately
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <GlassCard className="text-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-purple">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Curated MCP Servers</h3>
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  Expert-selected servers that work perfectly together. No guessing which tools to install.
                </p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">System Prompt</h3>
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  Production-tested prompts that give Claude the right context and capabilities for your workflow.
                </p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-success flex items-center justify-center mx-auto mb-4 shadow-glow-success">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">One Command Setup</h3>
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  Everything configured automatically. Start working in 10 seconds instead of 30 minutes.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <GradientText>Works</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-glow-purple">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Install OpenConductor CLI</h3>
                <code className="text-sm bg-slate-950 text-slate-100 p-3 rounded block mb-2 overflow-x-auto">
                  npm install -g @openconductor/cli
                </code>
                <p className="text-foreground-secondary text-sm">One-time setup. Takes 10 seconds.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-glow-blue">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Stack</h3>
                <code className="text-sm bg-slate-950 text-slate-100 p-3 rounded block mb-2 overflow-x-auto">
                  openconductor stack install coder
                </code>
                <p className="text-foreground-secondary text-sm">Pick the workflow that matches your needs.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-success flex items-center justify-center text-white font-bold text-lg shadow-glow-success">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Start Building</h3>
                <p className="text-foreground-secondary">
                  Open Claude Desktop. Your stack is ready. System prompt is active. Start working immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <GlassCard elevated className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to <GradientText>Ship Faster</GradientText>?
              </h2>
              <p className="text-foreground-secondary text-lg mb-8 max-w-2xl mx-auto">
                Join developers who stopped configuring and started building
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton size="lg" glow className="text-base px-8 h-12" asChild>
                  <Link href="/install">
                    <Terminal className="mr-2 h-4 w-4" />
                    Install a Stack Now
                  </Link>
                </GradientButton>
                <Button size="lg" variant="outline" className="text-base px-8 h-12 border-primary/20 hover:border-primary/40" asChild>
                  <Link href="/discover">
                    Browse Individual Servers
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
                <li><Link href="/stacks" className="hover:text-foreground transition-colors">Stacks</Link></li>
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
