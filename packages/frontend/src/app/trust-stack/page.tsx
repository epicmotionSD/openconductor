import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  Shield, 
  FileCheck, 
  Scale, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Building2,
  Globe,
  Lock,
  BadgeCheck,
  Layers,
  GitBranch,
  Database,
  BarChart3
} from 'lucide-react'
import { SiteHeader } from '@/components/navigation/site-header'
import { SiteFooter } from '@/components/navigation/site-footer'
import { GradientText } from '@/components/ui/gradient-text'

export const metadata: Metadata = {
  title: 'Trust Stack - 4-Layer Compliance Infrastructure for AI Agents',
  description: 'On-chain identity, policy governance, risk underwriting, and proof of compliance. The complete infrastructure stack for EU AI Act compliance and agent insurability.',
  openGraph: {
    title: 'Trust Stack - 4-Layer Compliance Infrastructure for AI Agents',
    description: 'On-chain identity, policy governance, risk underwriting, and proof of compliance.',
  },
}

const CONTRACT_ADDRESS = '0xf8d7044d657b602194fb5745c614beb35d5d898a'
const SUBGRAPH_URL = 'https://thegraph.com/studio/subgraph/openconductor/'

export default function TrustStackPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8">
                <Layers className="h-4 w-4" />
                Infrastructure for the Agentic Era
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold font-display mb-6">
                The <GradientText>Trust Stack</GradientText>
              </h1>
              
              <p className="text-xl md:text-2xl text-foreground-secondary mb-8 leading-relaxed">
                Four layers of infrastructure that transform AI agents from 
                unaccountable black boxes into auditable, insurable, compliant entities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  Register Your Agent
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary/30 text-foreground rounded-full font-semibold hover:bg-primary/10 transition-colors"
                >
                  View Contract
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section className="py-16 md:py-24 border-t border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12">
                Why AI Agents Need an Identity Layer
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                  <AlertTriangle className="h-8 w-8 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Regulatory Risk</h3>
                  <p className="text-foreground-secondary text-sm">
                    EU AI Act enforcement begins <span className="text-red-400 font-semibold">August 2026</span>. 
                    Non-compliant AI systems face fines up to <span className="text-red-400 font-semibold">€35M or 7% of global revenue</span>.
                  </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                  <Scale className="h-8 w-8 text-yellow-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Liability Exposure</h3>
                  <p className="text-foreground-secondary text-sm">
                    When an agent causes harm, who's responsible? Without identity and audit trails, 
                    <span className="text-yellow-400 font-semibold"> liability is undefined and unlimited</span>.
                  </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                  <Building2 className="h-8 w-8 text-orange-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Uninsurable</h3>
                  <p className="text-foreground-secondary text-sm">
                    Insurance carriers can't price risk for anonymous agents. 
                    <span className="text-orange-400 font-semibold"> No identity = no coverage = no enterprise deals</span>.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-center">
                <p className="text-lg text-foreground-secondary">
                  The Trust Stack solves this by giving every AI agent a <span className="text-primary font-semibold">verifiable on-chain identity</span>, 
                  connecting it to <span className="text-primary font-semibold">policy frameworks</span>, enabling 
                  <span className="text-primary font-semibold"> risk assessment</span>, and providing 
                  <span className="text-primary font-semibold"> proof of compliance</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Layer 1: Registry */}
        <section id="registry" className="py-16 md:py-24 border-t border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-500/20 text-green-400 font-bold text-xl">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-bold font-display">Registry</h2>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                      LIVE NOW
                    </span>
                  </div>
                  <p className="text-foreground-secondary">ERC-8004 Agent Identity Registry</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <p className="text-lg text-foreground-secondary mb-6">
                    The foundational layer. Every AI agent gets a unique, immutable on-chain identity 
                    with cryptographic proof of registration. This is the anchor for all compliance, 
                    auditing, and trust scoring.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">What Gets Registered</h3>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Unique Agent ID (ERC-721 NFT)',
                      'Registrant address (owner/operator)',
                      'Metadata URI (capabilities, version, docs)',
                      'Registration timestamp (immutable)',
                      'Trust tier (UNVERIFIED → CERTIFIED)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">Technical Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-foreground-secondary">Standard</span>
                      <span className="font-mono text-primary">ERC-8004</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-foreground-secondary">Network</span>
                      <span className="font-mono text-primary">Base Sepolia (Mainnet Q2)</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-foreground-secondary">Indexing</span>
                      <span className="font-mono text-primary">The Graph Subgraph</span>
                    </div>
                    <a 
                      href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-foreground-secondary">Contract</span>
                      <span className="font-mono text-primary flex items-center gap-1">
                        {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-muted/30 border border-primary/10">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Trust Tiers
                    </h3>
                    <div className="space-y-3">
                      {[
                        { tier: 'UNVERIFIED', color: 'text-gray-400', desc: 'Registered, no attestations' },
                        { tier: 'ATTESTED', color: 'text-blue-400', desc: 'Third-party attestation received' },
                        { tier: 'VERIFIED', color: 'text-purple-400', desc: 'Multiple attestations, audited' },
                        { tier: 'CERTIFIED', color: 'text-green-400', desc: 'ISO 42001 compliant, insurable' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                          <span className={`font-mono font-semibold ${item.color}`}>{item.tier}</span>
                          <span className="text-sm text-foreground-secondary">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BadgeCheck className="h-5 w-5 text-green-400" />
                      Attestation System
                    </h3>
                    <p className="text-foreground-secondary text-sm mb-4">
                      Third parties can attest to agent capabilities, audits, or certifications. 
                      Attestations are on-chain and queryable.
                    </p>
                    <div className="text-sm font-mono bg-background/50 p-3 rounded-lg">
                      <span className="text-muted-foreground">// Attestation types</span><br/>
                      <span className="text-purple-400">AUDIT</span> | <span className="text-blue-400">CAPABILITY</span> | <span className="text-green-400">CERTIFICATION</span> | <span className="text-yellow-400">ENDORSEMENT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layer 2: Governor */}
        <section id="governor" className="py-16 md:py-24 border-t border-primary/10 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold text-xl">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-bold font-display">Governor</h2>
                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Q2 2026
                    </span>
                  </div>
                  <p className="text-foreground-secondary">AP2 Policy Engine</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <p className="text-lg text-foreground-secondary mb-6">
                    Runtime policy enforcement for AI agents. Define what agents can and cannot do, 
                    enforce boundaries, and create audit trails for every action. Think of it as 
                    firewall rules for agent behavior.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">Policy Capabilities</h3>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Action allowlists/blocklists',
                      'Rate limiting and quotas',
                      'Data access boundaries',
                      'Human-in-the-loop triggers',
                      'Cost and resource caps',
                      'Geographic/jurisdictional rules',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FileCheck className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">Policy Format</h3>
                  <p className="text-foreground-secondary text-sm mb-4">
                    Policies are defined in AP2 (Agent Policy Protocol) - a declarative YAML/JSON format 
                    designed for AI agent governance.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-background border border-primary/10">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-yellow-400" />
                      Example Policy
                    </h3>
                    <pre className="text-sm font-mono bg-muted/30 p-4 rounded-lg overflow-x-auto">
{`policy:
  name: "production-agent-v1"
  agent_id: "0x1234...abcd"
  
rules:
  - action: "external_api_call"
    allow:
      - "api.stripe.com"
      - "api.openai.com"
    deny:
      - "*"  # Default deny
      
  - action: "data_access"
    scope: "customer_pii"
    require: "human_approval"
    
  - action: "spend"
    limit: "$100/day"
    alert_threshold: "$50"`}
                    </pre>
                  </div>

                  <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                    <h3 className="text-lg font-semibold mb-3">Integration Points</h3>
                    <p className="text-foreground-secondary text-sm">
                      Governor integrates with MCP servers, LangChain, CrewAI, and custom agent frameworks 
                      via middleware SDKs. Policy violations are logged on-chain for audit trails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layer 3: Underwriter */}
        <section id="underwriter" className="py-16 md:py-24 border-t border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-purple-500/20 text-purple-400 font-bold text-xl">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-bold font-display">Underwriter</h2>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Q3 2026
                    </span>
                  </div>
                  <p className="text-foreground-secondary">Risk Scoring & Insurance Bridge</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <p className="text-lg text-foreground-secondary mb-6">
                    Quantified risk assessment for AI agents. Combines on-chain history, policy compliance, 
                    attestations, and behavioral analysis into a risk score that insurance carriers can actually use.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">Risk Factors</h3>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Registration age and stability',
                      'Policy violation history',
                      'Attestation count and quality',
                      'Operator reputation score',
                      'Capability risk classification',
                      'Incident/claim history',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <BarChart3 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">Standards Alignment</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Lock className="h-5 w-5 text-purple-400" />
                      <div>
                        <span className="font-semibold">ISO 42001</span>
                        <span className="text-foreground-secondary text-sm ml-2">AI Management System</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Globe className="h-5 w-5 text-purple-400" />
                      <div>
                        <span className="font-semibold">EU AI Act</span>
                        <span className="text-foreground-secondary text-sm ml-2">High-risk system requirements</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Shield className="h-5 w-5 text-purple-400" />
                      <div>
                        <span className="font-semibold">SOC 2 Type II</span>
                        <span className="text-foreground-secondary text-sm ml-2">Security controls mapping</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-muted/30 border border-primary/10">
                    <h3 className="text-lg font-semibold mb-4">Risk Score Output</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground-secondary">Overall Risk Score</span>
                          <span className="font-mono text-green-400">A (Low Risk)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-background/50">
                          <div className="text-muted-foreground">Compliance</div>
                          <div className="font-semibold text-green-400">98%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50">
                          <div className="text-muted-foreground">Stability</div>
                          <div className="font-semibold text-green-400">94%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50">
                          <div className="text-muted-foreground">Attestations</div>
                          <div className="font-semibold text-blue-400">12</div>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50">
                          <div className="text-muted-foreground">Violations</div>
                          <div className="font-semibold text-green-400">0</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-400" />
                      Insurance Integration
                    </h3>
                    <p className="text-foreground-secondary text-sm mb-4">
                      Underwriter provides an API for insurance carriers to query agent risk profiles, 
                      enabling automated underwriting for AI liability coverage.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Partner carriers: In discussions with major cyber insurers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layer 4: Proof */}
        <section id="proof" className="py-16 md:py-24 border-t border-primary/10 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/20 text-blue-400 font-bold text-xl">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-bold font-display">Proof</h2>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold">
                      REFERENCE IMPLEMENTATION
                    </span>
                  </div>
                  <p className="text-foreground-secondary">x3o.ai Command Center</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <p className="text-lg text-foreground-secondary mb-6">
                    The Trust Stack isn't theoretical—it's running in production. x3o.ai Command Center 
                    is our reference implementation, demonstrating how enterprises can deploy compliant 
                    AI agent fleets at scale.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">What It Demonstrates</h3>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Multi-agent orchestration with Trinity AI',
                      'Real-time policy enforcement',
                      'Live trust score monitoring',
                      'Compliance dashboard for auditors',
                      'Incident response workflows',
                      'Insurance-ready documentation',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="https://x3o.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-400 rounded-full font-semibold hover:bg-blue-500/30 transition-colors"
                  >
                    Visit x3o.ai
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-background border border-primary/10">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-400" />
                      Trinity AI Architecture
                    </h3>
                    <p className="text-foreground-secondary text-sm mb-4">
                      Three specialized agents working in concert, each registered on the Trust Stack:
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="font-semibold text-purple-400">Oracle</div>
                        <div className="text-sm text-foreground-secondary">Analysis, prediction, synthesis</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="font-semibold text-red-400">Sentinel</div>
                        <div className="text-sm text-foreground-secondary">Security scanning, validation, monitoring</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="font-semibold text-green-400">Sage</div>
                        <div className="text-sm text-foreground-secondary">Documentation, learning, optimization</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <h3 className="text-lg font-semibold mb-3">Why a Reference Implementation?</h3>
                    <p className="text-foreground-secondary text-sm">
                      Enterprises need to see Trust Stack in action before committing. x3o.ai proves 
                      the architecture works at scale and provides a template for enterprise deployments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 md:py-24 border-t border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12">
                Roadmap to Full Stack
              </h2>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-purple-500" />

                <div className="space-y-8">
                  {[
                    { 
                      quarter: 'Q1 2026', 
                      title: 'Registry Launch', 
                      status: 'complete',
                      items: ['ERC-8004 deployed to Base Sepolia', 'Subgraph indexing live', 'Registration UI complete', 'First agents registered']
                    },
                    { 
                      quarter: 'Q2 2026', 
                      title: 'Governor Beta', 
                      status: 'current',
                      items: ['AP2 policy format specification', 'Policy engine alpha', 'MCP middleware SDK', 'Mainnet migration']
                    },
                    { 
                      quarter: 'Q3 2026', 
                      title: 'Underwriter Launch', 
                      status: 'upcoming',
                      items: ['Risk scoring algorithm', 'ISO 42001 mapping', 'Insurance carrier API', 'Compliance dashboard']
                    },
                    { 
                      quarter: 'Q4 2026', 
                      title: 'Full Stack GA', 
                      status: 'upcoming',
                      items: ['Enterprise tier launch', 'Multi-chain support', 'Certification program', 'Insurance partnerships live']
                    },
                  ].map((milestone, i) => (
                    <div key={i} className="relative pl-20">
                      <div className={`absolute left-6 w-4 h-4 rounded-full border-2 ${
                        milestone.status === 'complete' ? 'bg-green-500 border-green-500' :
                        milestone.status === 'current' ? 'bg-yellow-500 border-yellow-500 animate-pulse' :
                        'bg-background border-primary/50'
                      }`} />
                      
                      <div className="p-6 rounded-2xl bg-muted/30 border border-primary/10">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-primary">{milestone.quarter}</span>
                          <span className="font-semibold text-lg">{milestone.title}</span>
                          {milestone.status === 'complete' && (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {milestone.items.map((item, j) => (
                            <li key={j} className="text-sm text-foreground-secondary flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 border-t border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
                Get Started Today
              </h2>
              <p className="text-xl text-foreground-secondary mb-8">
                Layer 1 is live. Register your agent now and be ready for compliance 
                before enforcement begins.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  Register Your Agent
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/early-access"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary/30 text-foreground rounded-full font-semibold hover:bg-primary/10 transition-colors"
                >
                  Join Founding Cohort
                </Link>
              </div>

              <p className="text-sm text-muted-foreground mt-8">
                Questions? Reach out at{' '}
                <a href="mailto:trust@openconductor.ai" className="text-primary hover:underline">
                  trust@openconductor.ai
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
