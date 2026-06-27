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
  ArrowRight, Shield, Clock, Users, Zap, 
  CheckCircle, Calendar, Building2, Mail,
  Fingerprint, Scale, FileCheck
} from 'lucide-react'

export default function EarlyAccessPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    agentCount: '',
    useCase: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Connect to backend
    console.log('Early access application:', formData)
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />

          <div className="relative text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-2 text-sm bg-warning/10 border-warning/30 text-warning">
              <Users className="h-3 w-3 mr-2 inline" />
              Limited to 50 Founding Companies
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">
              Join the <GradientText>Founding Cohort</GradientText>
            </h1>

            <p className="text-lg md:text-xl text-foreground-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Get early access to the Trust Stack before 2026 enforcement.
              <br />
              Shape the future of compliant AI infrastructure.
            </p>
          </div>
        </section>

        {/* Benefits + Form */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Benefits */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-8">
                Founding Member <GradientText>Benefits</GradientText>
              </h2>

              <div className="space-y-6">
                <GlassCard className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Priority API Access</h3>
                    <p className="text-foreground-secondary text-sm">
                      First access to Registry, Governor, and Underwriter APIs as they launch.
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Direct Support</h3>
                    <p className="text-foreground-secondary text-sm">
                      Private Slack channel with the founding team. Your feedback shapes the product.
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Founding Pricing</h3>
                    <p className="text-foreground-secondary text-sm">
                      Lock in 60% discount on enterprise plans. Grandfather clause for life.
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Compliance Head Start</h3>
                    <p className="text-foreground-secondary text-sm">
                      Be 2026-ready before your competitors. Full Trust Stack integration support.
                    </p>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <GlassCard elevated className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Application Received!</h3>
                  <p className="text-foreground-secondary mb-6">
                    We'll review your application and get back to you within 48 hours.
                    Check your email for confirmation.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/discover">
                      Explore Registry While You Wait
                    </Link>
                  </Button>
                </GlassCard>
              ) : (
                <GlassCard elevated className="p-8">
                  <h3 className="text-xl font-bold mb-6">Apply for Early Access</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        required
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        required
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <Input
                        required
                        placeholder="Company name"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">How many AI agents do you run?</label>
                      <Input
                        placeholder="e.g., 5, 50, 500+"
                        value={formData.agentCount}
                        onChange={(e) => setFormData({ ...formData, agentCount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary use case</label>
                      <Input
                        placeholder="e.g., Customer support, Code generation, Data analysis"
                        value={formData.useCase}
                        onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                      />
                    </div>
                    <GradientButton type="submit" className="w-full mt-6" glow>
                      <Shield className="mr-2 h-4 w-4" />
                      Submit Application
                    </GradientButton>
                  </form>
                </GlassCard>
              )}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              2026 <GradientText>Roadmap</GradientText>
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
              Our path to full Trust Stack deployment
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-success via-primary to-muted" />

              {/* Q1 2026 */}
              <div className="relative flex items-start gap-6 mb-12">
                <div className="h-16 w-16 rounded-full bg-success/20 border-2 border-success flex items-center justify-center flex-shrink-0 z-10">
                  <Fingerprint className="h-6 w-6 text-success" />
                </div>
                <div className="pt-3">
                  <Badge className="mb-2 bg-success/10 border-success/30 text-success">Q1 2026 • NOW</Badge>
                  <h3 className="text-xl font-bold mb-2">Registry Layer Live</h3>
                  <p className="text-foreground-secondary">
                    ERC-8004 identity standard. Agent registration and KYA verification. 220+ MCP servers indexed.
                  </p>
                </div>
              </div>

              {/* Q2 2026 */}
              <div className="relative flex items-start gap-6 mb-12">
                <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0 z-10">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <div className="pt-3">
                  <Badge className="mb-2 bg-primary/10 border-primary/30 text-primary">Q2 2026</Badge>
                  <h3 className="text-xl font-bold mb-2">Governor Layer Launch</h3>
                  <p className="text-foreground-secondary">
                    AP2 policy engine. PEP sidecars for runtime enforcement. EU AI Act compliance templates.
                  </p>
                </div>
              </div>

              {/* Q3 2026 */}
              <div className="relative flex items-start gap-6 mb-12">
                <div className="h-16 w-16 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0 z-10">
                  <FileCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="pt-3">
                  <Badge className="mb-2 bg-muted border-muted-foreground/30">Q3 2026</Badge>
                  <h3 className="text-xl font-bold mb-2">Underwriter Layer</h3>
                  <p className="text-foreground-secondary">
                    Risk scoring algorithms. ISO 42001 certification pathway. Insurance partner integrations.
                  </p>
                </div>
              </div>

              {/* Q4 2026 */}
              <div className="relative flex items-start gap-6">
                <div className="h-16 w-16 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0 z-10">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="pt-3">
                  <Badge className="mb-2 bg-muted border-muted-foreground/30">Q4 2026</Badge>
                  <h3 className="text-xl font-bold mb-2">Full Stack GA</h3>
                  <p className="text-foreground-secondary">
                    Complete Trust Stack available. Enterprise bonding. The trust computer that agents MUST run on.
                  </p>
                </div>
              </div>
            </div>
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
