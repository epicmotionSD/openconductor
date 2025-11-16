'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBox } from '@/components/ui/alert-box'
import { SiteHeader } from '@/components/navigation/site-header'
import { Terminal, Github, CheckCircle, ArrowLeft } from 'lucide-react'

export default function SubmitServerPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discovery
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-foreground">Submit Your MCP Server</h1>
            <Badge variant="outline" className="bg-primary text-primary-foreground border-none text-sm px-3 py-1">
              Beta Feature
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Add your Model Context Protocol server to our exclusive beta registry.
          </p>
        </div>

        {/* Beta Notice */}
        <div className="max-w-2xl mx-auto mb-8">
          <AlertBox variant="info" title="🎯 Enterprise Beta Submission">
            <p className="mb-4">
              Server submissions are currently available to our first 1000 beta users with enterprise-grade automation.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Automated GitHub sync and metadata extraction</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Professional review and verification process</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Real-time updates and analytics tracking</span>
              </li>
            </ul>
          </AlertBox>
        </div>

        {/* Submission Instructions */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How to Submit (Beta)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AlertBox variant="info">
                <p>
                  <strong>During beta:</strong> Submit servers via our GitHub repository or Discord community.
                  The full web submission form launches with the public platform.
                </p>
              </AlertBox>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Submission Methods:</h3>
                
                <div className="flex gap-4">
                  <Button asChild className="flex-1">
                    <a href="https://github.com/openconductor/openconductor/discussions" target="_blank">
                      <Github className="h-4 w-4 mr-2" />
                      Submit via GitHub
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild className="flex-1">
                    <a href="https://discord.gg/openconductor" target="_blank">
                      Submit via Discord
                    </a>
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <h4 className="font-medium mb-2 text-foreground">Requirements:</h4>
                <ul className="space-y-1">
                  <li>• Valid MCP server implementation</li>
                  <li>• Clear installation instructions in README</li>
                  <li>• Open source license (preferred)</li>
                  <li>• Active maintenance and support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}