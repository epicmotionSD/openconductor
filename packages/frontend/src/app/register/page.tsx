'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/navigation/site-header'
import { GradientText } from '@/components/ui/gradient-text'
import { GradientButton } from '@/components/ui/gradient-button'
import { GlassCard } from '@/components/ui/glass-card'
import { 
  ArrowRight, Shield, CheckCircle, Fingerprint, 
  Scale, FileCheck, Building2, AlertTriangle,
  Github, Globe, Terminal, Lock, Eye, Zap
} from 'lucide-react'

const verificationTiers = [
  {
    name: 'Basic',
    badge: 'OPEN',
    color: 'primary',
    description: 'Self-reported registration',
    features: ['Agent ID issued', 'Public listing', 'Basic metadata'],
    requirements: ['GitHub or npm link', 'Description'],
    trustScore: '1-3'
  },
  {
    name: 'Verified',
    badge: 'VERIFIED',
    color: 'success',
    description: 'Identity confirmed',
    features: ['Verified badge', 'Enhanced visibility', 'API access', 'Analytics'],
    requirements: ['Code review passed', 'Maintainer verified', 'Security scan'],
    trustScore: '4-7'
  },
  {
    name: 'Certified',
    badge: 'CERTIFIED',
    color: 'warning',
    description: 'Enterprise-ready',
    features: ['Certified badge', 'Priority support', 'Insurance eligible', 'SLA tracking'],
    requirements: ['ISO 42001 alignment', 'Audit trail', 'Policy compliance'],
    trustScore: '8-10'
  }
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    agentName: '',
    sourceUrl: '',
    description: '',
    maintainerEmail: '',
    category: ''
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-2 text-sm bg-primary/10 border-primary/30">
              <Fingerprint className="h-3 w-3 mr-2 inline" />
              ERC-8004 Identity Standard
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              Register Your <GradientText>AI Agent</GradientText>
            </h1>

            <p className="text-lg md:text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
              Get a verifiable identity for your agent. Required for governance, compliance, and insurance eligibility.
            </p>
          </div>
        </section>

        {/* Verification Tiers */}
        <section className="container mx-auto px-4 pb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Verification <GradientText>Tiers</GradientText>
            </h2>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              Higher verification = higher trust scores = lower insurance premiums
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {verificationTiers.map((tier) => (
              <GlassCard 
                key={tier.name} 
                className={`relative hover:border-${tier.color}/50 transition-colors`}
              >
                <Badge className={`absolute top-4 right-4 bg-${tier.color}/20 text-${tier.color} border-${tier.color}/30 text-xs`}>
                  {tier.badge}
                </Badge>
                
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <p className="text-foreground-secondary text-sm mb-4">{tier.description}</p>
                
                <div className="mb-4">
                  <div className="text-xs text-foreground-secondary mb-2">Trust Score</div>
                  <div className="text-2xl font-bold">
                    <GradientText>{tier.trustScore}</GradientText>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-foreground-secondary mb-2">Includes</div>
                  <ul className="space-y-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-xs text-foreground-secondary mb-2">Requirements</div>
                  <ul className="space-y-1">
                    {tier.requirements.map((req) => (
                      <li key={req} className="text-sm text-foreground-secondary flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground-secondary" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Registration Form */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="max-w-2xl mx-auto">
            <GlassCard elevated className="p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Register Agent (Basic Tier)
              </h3>

              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Agent / Server Name</label>
                  <Input
                    placeholder="e.g., filesystem-mcp, github-tools"
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Source URL</label>
                  <Input
                    placeholder="https://github.com/org/repo or npm package"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  />
                  <p className="text-xs text-foreground-secondary mt-1">GitHub repo or npm package URL</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    placeholder="What does this agent do?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Maintainer Email</label>
                  <Input
                    type="email"
                    placeholder="maintainer@example.com"
                    value={formData.maintainerEmail}
                    onChange={(e) => setFormData({ ...formData, maintainerEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    placeholder="e.g., filesystem, database, api, productivity"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <GradientButton type="submit" className="w-full" glow>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Register Agent
                  </GradientButton>
                  <p className="text-xs text-center text-foreground-secondary mt-3">
                    Registration is free. Verification upgrades available after basic registration.
                  </p>
                </div>
              </form>
            </GlassCard>
          </div>
        </section>

        {/* Why Register */}
        <section className="container mx-auto px-4 pb-16 md:pb-24 bg-muted/20 py-16 rounded-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Why <GradientText>Register</GradientText>?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Discoverability</h3>
              <p className="text-sm text-foreground-secondary">
                Get listed in the registry. Users find and install your agent.
              </p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Trust Score</h3>
              <p className="text-sm text-foreground-secondary">
                Build reputation. Higher scores unlock enterprise opportunities.
              </p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Scale className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Governance Ready</h3>
              <p className="text-sm text-foreground-secondary">
                Prepare for AP2 policy enforcement and compliance requirements.
              </p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">Insurance Path</h3>
              <p className="text-sm text-foreground-secondary">
                Certified agents become insurable. Required for enterprise deployment.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-foreground-secondary mb-6">
              Already have agents in production? Get early access to the full Trust Stack.
            </p>
            <Button variant="outline" asChild>
              <Link href="/early-access">
                Apply for Early Access <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024-2026 OpenConductor. Building the trust computer for AI agents.</p>
        </div>
      </footer>
    </div>
  )
}
