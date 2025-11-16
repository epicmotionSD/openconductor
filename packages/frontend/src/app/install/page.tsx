import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/navigation/site-header'
import { Terminal, Download, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react'

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="minimal" />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6 text-foreground">Install OpenConductor CLI</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with the OpenConductor CLI to discover, install, and manage MCP servers in seconds.
          </p>
        </div>

        {/* Quick Install */}
        <Card className="mb-12 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Quick Install
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-6 font-mono text-sm mb-4">
              <div className="flex items-center justify-between">
                <code>npm install -g @openconductor/cli</code>
                <Button variant="outline" size="sm">
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Requires Node.js 18+ and npm. Works on macOS, Windows, and Linux.
            </p>
          </CardContent>
        </Card>

        {/* Installation Methods */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                NPM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded p-3 font-mono text-sm">
                npm install -g @openconductor/cli
              </div>
              <p className="text-sm text-muted-foreground">
                Install globally via npm for easy access from anywhere.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Yarn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded p-3 font-mono text-sm">
                yarn global add @openconductor/cli
              </div>
              <p className="text-sm text-muted-foreground">
                Alternative installation using Yarn package manager.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded p-3 font-mono text-sm">
                git clone && npm install
              </div>
              <p className="text-sm text-muted-foreground">
                Build from source for the latest development version.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/openconductor/openconductor" target="_blank">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Install CLI</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Install OpenConductor globally via npm
                    </p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      npm install -g @openconductor/cli
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Discover Servers</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Search for MCP servers by category or name
                    </p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      openconductor discover "memory"
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Install Server</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      One-command install to Claude Desktop
                    </p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      openconductor install openmemory
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Verify Installation</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      List all installed MCP servers
                    </p>
                    <div className="bg-muted rounded p-2 font-mono text-xs">
                      openconductor list
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">5</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Start Using</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Restart Claude Desktop and enjoy!
                    </p>
                    <div className="flex items-center gap-1 text-success text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Ready to use
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Commands */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Common Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">openconductor discover</code>
                  <p className="text-sm text-muted-foreground mt-1">Browse all MCP servers</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">openconductor discover --category api</code>
                  <p className="text-sm text-muted-foreground mt-1">Filter by category</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">openconductor install &lt;server&gt;</code>
                  <p className="text-sm text-muted-foreground mt-1">Install MCP server</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">openconductor list</code>
                  <p className="text-sm text-muted-foreground mt-1">Show installed servers</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">openconductor config --show</code>
                  <p className="text-sm text-muted-foreground mt-1">View configuration</p>
                </div>
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">openconductor --help</code>
                  <p className="text-sm text-muted-foreground mt-1">Get help and options</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Discover amazing MCP servers for your AI applications
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/discover">
                Browse Servers <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}