'use client'

import { GradientText } from "@/components/ui/gradient-text"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Code, Star, Rocket } from "lucide-react"

export default function TestColorsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            OpenConductor <GradientText>Color System</GradientText>
          </h1>
          <p className="text-foreground-secondary text-xl">
            Testing all brand colors and components
          </p>
        </div>

        {/* Backgrounds */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Backgrounds</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-background h-32 rounded-lg p-4 border border-primary/20">
              <div className="text-sm font-medium">Background</div>
              <div className="text-xs text-foreground-muted">#0F0F1A</div>
            </div>
            <div className="bg-background-surface h-32 rounded-lg p-4 border border-primary/20">
              <div className="text-sm font-medium">Surface</div>
              <div className="text-xs text-foreground-muted">#1A1A2E</div>
            </div>
            <div className="bg-background-elevated h-32 rounded-lg p-4 border border-primary/20">
              <div className="text-sm font-medium">Elevated</div>
              <div className="text-xs text-foreground-muted">#252541</div>
            </div>
            <div className="bg-background-hover h-32 rounded-lg p-4 border border-primary/20">
              <div className="text-sm font-medium">Hover</div>
              <div className="text-xs text-foreground-muted">#2F2F54</div>
            </div>
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Brand Gradients</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-primary h-32 rounded-lg p-4 text-white flex items-center justify-center font-bold">
              Primary
            </div>
            <div className="bg-gradient-success h-32 rounded-lg p-4 text-white flex items-center justify-center font-bold">
              Success
            </div>
            <div className="bg-gradient-error h-32 rounded-lg p-4 text-white flex items-center justify-center font-bold">
              Error
            </div>
            <div className="bg-gradient-warning h-32 rounded-lg p-4 text-white flex items-center justify-center font-bold">
              Warning
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Buttons</h2>
          <div className="flex gap-4 flex-wrap">
            <GradientButton>
              <Zap className="mr-2 h-4 w-4" />
              Gradient Button
            </GradientButton>
            <GradientButton glow>
              <Star className="mr-2 h-4 w-4" />
              With Glow
            </GradientButton>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button className="bg-success hover:bg-success/90">Success</Button>
          </div>
        </section>

        {/* Glass Cards */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Glass Morphism</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Glass Card</h3>
                  <p className="text-xs text-foreground-muted">Default variant</p>
                </div>
              </div>
              <p className="text-foreground-secondary">
                Semi-transparent with backdrop blur effect. Perfect for overlays and modern UI.
              </p>
            </GlassCard>

            <GlassCard elevated>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-success flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Elevated Glass</h3>
                  <p className="text-xs text-foreground-muted">Elevated variant</p>
                </div>
              </div>
              <p className="text-foreground-secondary">
                More prominent blur and stronger border for elevated content.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Glow Effects */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Glow Effects</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glow-purple bg-primary h-40 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              Purple Glow
            </div>
            <div className="glow-blue bg-secondary h-40 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              Blue Glow
            </div>
            <div className="glow-success bg-success h-40 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              Success Glow
            </div>
          </div>
        </section>

        {/* Text Hierarchy */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Text Hierarchy</h2>
          <div className="bg-background-surface rounded-lg p-6 space-y-3">
            <div className="text-foreground text-lg">
              Primary Text - Maximum contrast for body text
            </div>
            <div className="text-foreground-secondary text-lg">
              Secondary Text - For less important information
            </div>
            <div className="text-foreground-muted text-lg">
              Muted Text - For hints and supporting text
            </div>
            <div className="text-foreground-disabled text-lg">
              Disabled Text - For inactive elements
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Badges</h2>
          <div className="flex gap-3 flex-wrap">
            <Badge className="bg-primary">Primary</Badge>
            <Badge className="bg-secondary">Secondary</Badge>
            <Badge className="bg-success">Success</Badge>
            <Badge className="bg-destructive">Error</Badge>
            <Badge className="bg-warning text-black">Warning</Badge>
            <Badge className="bg-cta">CTA</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background-surface border-primary/20">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-secondary">
                  Standard card with surface background
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background-elevated border-primary/30">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-secondary">
                  Slightly elevated with stronger border
                </p>
              </CardContent>
            </Card>

            <Card className="border-gradient">
              <CardHeader>
                <CardTitle>Gradient Border</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-secondary">
                  Card with animated gradient border
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Gradient Text Examples */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Gradient Text</h2>
          <div className="space-y-4">
            <div className="text-6xl font-bold">
              <GradientText>OpenConductor</GradientText>
            </div>
            <div className="text-4xl font-bold">
              Install <GradientText>Stacks</GradientText> in 10 seconds
            </div>
            <div className="text-2xl">
              <GradientText animated>Animated Gradient Text</GradientText>
            </div>
          </div>
        </section>

        {/* Color Reference */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Color Reference</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-background-surface rounded-lg p-6 space-y-2">
              <h3 className="font-bold mb-3">Brand Colors</h3>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Primary Purple</span>
                <code className="text-xs bg-background-elevated px-2 py-1 rounded">#8B5CF6</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Secondary Blue</span>
                <code className="text-xs bg-background-elevated px-2 py-1 rounded">#3B82F6</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">CTA Orange</span>
                <code className="text-xs bg-background-elevated px-2 py-1 rounded">#FF6B6B</code>
              </div>
            </div>

            <div className="bg-background-surface rounded-lg p-6 space-y-2">
              <h3 className="font-bold mb-3">Status Colors</h3>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Success Green</span>
                <code className="text-xs bg-background-elevated px-2 py-1 rounded">#10B981</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Error Red</span>
                <code className="text-xs bg-background-elevated px-2 py-1 rounded">#EF4444</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Warning Orange</span>
                <code className="text-xs bg-background-elevated px-2 py-1 rounded">#FFA657</code>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
