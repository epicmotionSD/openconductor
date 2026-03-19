import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, ExternalLink } from 'lucide-react'
import { SiteHeader } from '@/components/navigation/site-header'
import { SiteFooter } from '@/components/navigation/site-footer'
import { GradientText } from '@/components/ui/gradient-text'

export const metadata: Metadata = {
  title: "Jensen Is Right — Every Company Needs an OpenClaw Strategy. Here's What He Didn't Say.",
  description: 'Every OpenClaw agent needs a Trust Stack. Identity, compliance, and billing for the agent economy — shipped as an npm package.',
  openGraph: {
    title: "Jensen Is Right — Every Company Needs an OpenClaw Strategy. Here's What He Didn't Say.",
    description: 'Every OpenClaw agent needs a Trust Stack. Identity, compliance, and billing for the agent economy — shipped as an npm package.',
  },
}

export default function GtcBlogPost() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Blog
              </Link>

              <div className="flex flex-wrap gap-2 mb-6">
                {['GTC 2026', 'OpenClaw', 'Trust Stack', 'EU AI Act'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight mb-6">
                Jensen Is Right — Every Company Needs an OpenClaw Strategy.{' '}
                <GradientText>Here&apos;s What He Didn&apos;t Say.</GradientText>
              </h1>

              <p className="text-xl text-muted-foreground italic mb-8">
                Every OpenClaw agent needs a Trust Stack.
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b border-primary/10 pb-8">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Shawn — Founder, OpenConductor
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  March 17, 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  8 min read
                </span>
                <a
                  href="https://dev.to/epicmotionsd/jensen-is-right-every-company-needs-an-openclaw-strategy-heres-what-he-didnt-say-4l4p"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline ml-auto"
                >
                  <ExternalLink className="h-4 w-4" />
                  Also on DEV.to
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Article Body */}
        <article className="container mx-auto px-4 pb-20">
          <div className="max-w-3xl mx-auto prose prose-invert prose-purple prose-lg prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-pre:bg-muted/50 prose-pre:border prose-pre:border-primary/10 prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground">

            <p>
              Last week at GTC 2026, Jensen Huang did something extraordinary. He didn&apos;t just talk about
              GPU clusters or inference benchmarks. He pointed at the future:{' '}
              <strong>autonomous AI agents as the fundamental unit of enterprise software.</strong>
            </p>

            <p>
              OpenClaw — the open-source agent OS spearheaded by Peter Steinberger — got a full-stage endorsement.
              NemoClaw, Nvidia&apos;s network guardrail and privacy router, debuted alongside it. The message was
              unmistakable:
            </p>

            <p><strong>The agent economy is no longer theoretical. It&apos;s infrastructure.</strong></p>

            <p>I agree with Jensen. But he left something out.</p>

            <hr />

            <h2>The Missing Layer</h2>

            <p>Here&apos;s the question nobody on that stage asked:</p>

            <blockquote>
              When every company has 50 agents running autonomously — signing contracts, moving money,
              making decisions — <strong>who are those agents?</strong> Who&apos;s responsible when one
              goes wrong? And who pays?
            </blockquote>

            <p>
              OpenClaw gives agents capabilities. NemoClaw gives them guardrails. But neither gives them
              an <strong>identity</strong>.
            </p>

            <ul>
              <li>No audit trail a regulator can verify</li>
              <li>No compliance posture an insurer can underwrite</li>
              <li>No billing meter a CFO can track</li>
              <li>No trust score a partner can evaluate</li>
            </ul>

            <p>This isn&apos;t a feature gap. It&apos;s a <strong>category</strong> gap.</p>

            <hr />

            <h2>We&apos;ve Been Building This for a Year</h2>

            <p>
              At{' '}
              <a href="https://github.com/OpenConductor/openconductor" target="_blank" rel="noreferrer">
                OpenConductor
              </a>
              , we saw this coming. While the world debated prompt engineering, we shipped:
            </p>

            <p>
              <strong>220+ MCP servers indexed</strong> in the largest open registry — the supply side of the
              agent economy.
            </p>

            <p>
              <strong>ERC-8004</strong> — an on-chain agent identity standard, live on Base Sepolia since Q1
              2026. Every agent gets a verifiable, portable identity anchored to a smart contract. Not a
              database row. Not an API key. A <strong>cryptographic identity</strong>.
            </p>

            <p>
              <strong>Trust Stack</strong> — four layers that sit <em>beneath</em> any agent framework:
            </p>

            <div className="not-prose overflow-x-auto mb-8">
              <table className="w-full text-sm border border-primary/10 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Layer</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">What It Does</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Why It Matters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Registry</td>
                    <td className="px-4 py-3 text-muted-foreground">Agent discovery &amp; metadata</td>
                    <td className="px-4 py-3 text-muted-foreground">Know what&apos;s running</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Identity</td>
                    <td className="px-4 py-3 text-muted-foreground">ERC-8004 on-chain registration</td>
                    <td className="px-4 py-3 text-muted-foreground">Prove who&apos;s running it</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Governance</td>
                    <td className="px-4 py-3 text-muted-foreground">Policy engine &amp; permissions</td>
                    <td className="px-4 py-3 text-muted-foreground">Control what it can do</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Compliance</td>
                    <td className="px-4 py-3 text-muted-foreground">EU AI Act, ISO 42001, audit trails</td>
                    <td className="px-4 py-3 text-muted-foreground">Survive the audit</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              This isn&apos;t a competitor to OpenClaw. It&apos;s the <strong>complement</strong>. OpenClaw is the
              brain. Trust Stack is the birth certificate, the insurance card, and the billing address.
            </p>

            <hr />

            <h2>The EU AI Act Deadline Is 5 Months Away</h2>

            <p>
              August 2026. That&apos;s when the EU AI Act&apos;s high-risk system requirements go into enforcement.
              Every enterprise deploying AI agents in the EU market will need:
            </p>

            <ul>
              <li>✅ Agent identity tracking</li>
              <li>✅ Risk classification (minimal → unacceptable)</li>
              <li>✅ Audit trails for every autonomous decision</li>
              <li>✅ Human oversight documentation</li>
            </ul>

            <p>
              Companies that don&apos;t have this infrastructure{' '}
              <strong>will not be able to operate AI agents in the EU.</strong> Full stop.
            </p>

            <p>
              The ones building their own compliance layer from scratch? They&apos;ll spend 6-12 months
              reinventing what we&apos;ve already shipped.
            </p>

            <hr />

            <h2>What We Shipped This Week</h2>

            <p>
              Today we&apos;re releasing{' '}
              <a
                href="https://www.npmjs.com/package/@openconductor/openclaw-trust-stack"
                target="_blank"
                rel="noreferrer"
              >
                <code>@openconductor/openclaw-trust-stack</code>
              </a>{' '}
              — an SDK that wraps any OpenClaw agent with identity, compliance, and monetization in three lines:
            </p>

            <pre><code className="language-typescript">{`import { TrustStack } from '@openconductor/openclaw-trust-stack';

const agent = TrustStack.wrap(myOpenClawAgent, {
  identity: { name: 'My Agent', owner: '0x...', category: 'productivity' },
  compliance: { euAiAct: true, riskLevel: 'limited' },
  monetization: { perAction: 0.01, currency: 'USD' }
});

await agent.register(); // On-chain ERC-8004 identity`}</code></pre>

            <p>That&apos;s it. Your agent now has:</p>

            <ul>
              <li>A verifiable on-chain identity (ERC-8004 on Base)</li>
              <li>EU AI Act risk classification baked in</li>
              <li>A compliance summary exportable for auditors</li>
              <li>A monetization config ready for metered billing</li>
              <li>An audit trail that logs every action with compliance context</li>
            </ul>

            <hr />

            <h2>The Stack for the Stack</h2>

            <p>Here&apos;s how I think about the agent economy in 2026:</p>

            <div className="not-prose mb-8">
              <div className="font-mono text-sm bg-muted/50 border border-primary/10 rounded-lg p-6 overflow-x-auto">
                <pre className="text-muted-foreground">{`┌────────────────────────────────────┐
│  Applications (your product)       │
├────────────────────────────────────┤
│  Agent Framework (OpenClaw)        │
├────────────────────────────────────┤
│  Guardrails (NemoClaw)             │
├────────────────────────────────────┤
│  Trust Stack (OpenConductor)       │  ← identity + compliance + billing
├────────────────────────────────────┤
│  Blockchain (Base / Ethereum)      │
└────────────────────────────────────┘`}</pre>
              </div>
            </div>

            <p>
              Every layer needs the one below it. Agents need guardrails. Guardrails need identity.
              Identity needs a ledger. <strong>We&apos;re the identity layer.</strong>
            </p>

            <hr />

            <h2>What This Means for Builders</h2>

            <p>If you&apos;re building on OpenClaw today — or planning to — here&apos;s the play:</p>

            <ol>
              <li>
                <strong>Register your agents now.</strong> Testnet is free. Get on-chain identity before
                mainnet launch in Q2.
              </li>
              <li>
                <strong>Bake compliance in early.</strong> The EU AI Act deadline doesn&apos;t care about
                your sprint velocity.
              </li>
              <li>
                <strong>Ship with billing.</strong> Every autonomous action should be metered. Your CFO
                will thank you.
              </li>
            </ol>

            <p>
              We&apos;re onboarding a founding cohort of companies who want to be first to production with
              fully compliant, identity-verified agents. Early pricing locks in before mainnet.
            </p>

            <div className="not-prose flex flex-wrap gap-4 my-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Register your first agent
              </Link>
              <a
                href="https://www.npmjs.com/package/@openconductor/openclaw-trust-stack"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/20 text-foreground font-semibold text-sm hover:bg-muted/60 transition-colors"
              >
                Install the SDK ↗
              </a>
              <a
                href="https://github.com/OpenConductor/openconductor"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/20 text-foreground font-semibold text-sm hover:bg-muted/60 transition-colors"
              >
                Star us on GitHub ↗
              </a>
            </div>

            <hr />

            <h2>To Peter Steinberger and the OpenClaw Team</h2>

            <p>
              You&apos;re building something that matters. The open-source agent OS is going to be the Linux
              of the agent economy. We want Trust Stack to be the identity layer that ships with it.
            </p>

            <p>
              Let&apos;s talk. Our ERC-8004 standard + your OpenClaw runtime = the first fully compliant,
              identity-verified agent deployment stack.
            </p>

            <p><strong>DMs are open. Let&apos;s build the infrastructure layer together.</strong></p>

            <hr />

            <p className="text-base italic text-muted-foreground">
              Shawn is the founder of{' '}
              <a href="https://openconductor.ai">OpenConductor</a> and{' '}
              <a href="https://x3o.ai">x3o.ai</a>, building infrastructure for the agent economy.
              OpenConductor&apos;s Trust Stack has registered the first on-chain AI agent identity (Token #1)
              via ERC-8004 on Base.
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
