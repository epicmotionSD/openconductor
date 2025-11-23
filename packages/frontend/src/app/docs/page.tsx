import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/navigation/site-header'
import { Terminal, Book, ExternalLink, ArrowRight, Zap, Shield, Users } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="minimal" />

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6 text-foreground">Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using OpenConductor to manage MCP servers
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get up and running with OpenConductor in minutes
              </p>
              <Button size="sm" asChild>
                <Link href="/install">
                  Get Started <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                CLI Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Complete command reference and examples
              </p>
              <Button size="sm" variant="outline">
                View Commands
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                API Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                REST API documentation for developers
              </p>
              <Button size="sm" variant="outline">
                View API Docs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <h4 className="font-medium">Getting Started</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><a href="#installation" className="text-muted-foreground hover:text-foreground">Installation</a></li>
                    <li><a href="#quick-start" className="text-muted-foreground hover:text-foreground">Quick Start</a></li>
                    <li><a href="#configuration" className="text-muted-foreground hover:text-foreground">Configuration</a></li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">Core Commands</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><a href="#discover" className="text-muted-foreground hover:text-foreground">discover</a></li>
                    <li><a href="#install" className="text-muted-foreground hover:text-foreground">install</a></li>
                    <li><a href="#list" className="text-muted-foreground hover:text-foreground">list</a></li>
                    <li><a href="#remove" className="text-muted-foreground hover:text-foreground">remove</a></li>
                    <li><a href="#update" className="text-muted-foreground hover:text-foreground">update</a></li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">Stack Commands</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><a href="#stack-list" className="text-muted-foreground hover:text-foreground">stack list</a></li>
                    <li><a href="#stack-install" className="text-muted-foreground hover:text-foreground">stack install</a></li>
                    <li><a href="#stack-show" className="text-muted-foreground hover:text-foreground">stack show</a></li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">Developer Tools</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><a href="#badge" className="text-muted-foreground hover:text-foreground">badge</a></li>
                    <li><a href="#achievements" className="text-muted-foreground hover:text-foreground">achievements</a></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Installation */}
            <Card id="installation">
              <CardHeader>
                <CardTitle>Installation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  OpenConductor requires Node.js 18+ and works on macOS, Windows, and Linux.
                </p>
                
                <div>
                  <h4 className="font-medium mb-2">Global Installation</h4>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    npm install -g @openconductor/cli
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Verify Installation</h4>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    openconductor --version
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card id="quick-start">
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Discover MCP Servers
                    </h4>
                    <div className="bg-muted rounded-lg p-4 font-mono text-sm mb-2">
                      openconductor discover "memory"
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Search the registry for MCP servers by category, name, or functionality.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Install a Server
                    </h4>
                    <div className="bg-muted rounded-lg p-4 font-mono text-sm mb-2">
                      openconductor install openmemory
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Install any MCP server directly to your Claude Desktop configuration.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Verify Installation
                    </h4>
                    <div className="bg-muted rounded-lg p-4 font-mono text-sm mb-2">
                      openconductor list
                    </div>
                    <p className="text-sm text-muted-foreground">
                      See all installed MCP servers and their configurations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CLI Commands */}
            <Card id="discover">
              <CardHeader>
                <CardTitle>CLI Commands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">openconductor discover</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Search and browse MCP servers in the registry.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-muted rounded p-3 font-mono text-sm">
                      # Browse all servers<br/>
                      openconductor discover<br/><br/>
                      # Search for specific servers<br/>
                      openconductor discover "memory"<br/><br/>
                      # Filter by category<br/>
                      openconductor discover --category filesystem<br/><br/>
                      # Show only verified servers<br/>
                      openconductor discover --verified
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">openconductor install</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Install MCP servers to Claude Desktop configuration.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Install to default config<br/>
                    openconductor install openmemory<br/><br/>
                    # Install to custom config<br/>
                    openconductor install postgres --config ./my-config.json<br/><br/>
                    # Force overwrite<br/>
                    openconductor install github --force<br/><br/>
                    # Preview changes<br/>
                    openconductor install slack --dry-run
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">openconductor list</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    List installed MCP servers and their configurations.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Show installed servers<br/>
                    openconductor list<br/><br/>
                    # JSON output<br/>
                    openconductor list --format json<br/><br/>
                    # Custom config file<br/>
                    openconductor list --config ./my-config.json
                  </div>
                </div>

                <div id="remove">
                  <h4 className="font-medium mb-2">openconductor remove</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Remove installed MCP servers from your configuration.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Remove a server<br/>
                    openconductor remove openmemory<br/><br/>
                    # Skip confirmation<br/>
                    openconductor remove github-mcp -y<br/><br/>
                    # Alias: uninstall<br/>
                    openconductor uninstall slack
                  </div>
                </div>

                <div id="update">
                  <h4 className="font-medium mb-2">openconductor update</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Update installed MCP servers to their latest versions.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Update specific server<br/>
                    openconductor update github-mcp<br/><br/>
                    # Update all servers<br/>
                    openconductor update
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stack Commands */}
            <Card id="stack-list">
              <CardHeader>
                <CardTitle>Stack Commands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Stacks are pre-configured collections of MCP servers designed for specific workflows.
                  Each stack includes a system prompt to give Claude a specialized persona.
                </p>

                <div>
                  <h4 className="font-medium mb-2">openconductor stack list</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    View all available stacks and their descriptions.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    openconductor stack list
                  </div>
                </div>

                <div id="stack-install">
                  <h4 className="font-medium mb-2">openconductor stack install</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Install all servers in a stack and copy the system prompt to your clipboard.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Install Coder stack (5 servers)<br/>
                    openconductor stack install coder<br/><br/>
                    # Install Writer stack (4 servers)<br/>
                    openconductor stack install writer<br/><br/>
                    # Install Essential stack (3 servers)<br/>
                    openconductor stack install essential<br/><br/>
                    # Force reinstall<br/>
                    openconductor stack install coder --force
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 After installation, paste the system prompt into Claude Desktop &gt; Custom Instructions
                  </p>
                </div>

                <div id="stack-show">
                  <h4 className="font-medium mb-2">openconductor stack show</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    View details about a specific stack including all servers and the system prompt.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    openconductor stack show coder
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Developer Tools */}
            <Card id="badge">
              <CardHeader>
                <CardTitle>Developer Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">openconductor badge</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Generate installation badges for your MCP server README files.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Generate simple badge<br/>
                    openconductor badge your-server --simple<br/><br/>
                    # Generate command snippet<br/>
                    openconductor badge your-server --command<br/><br/>
                    # Generate full installation section<br/>
                    openconductor badge your-server --full<br/><br/>
                    # List all templates<br/>
                    openconductor badge-templates
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 Badges are automatically copied to clipboard for easy pasting into README.md
                  </p>
                </div>

                <div id="achievements">
                  <h4 className="font-medium mb-2">openconductor achievements</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    View your unlocked achievements and track your progress.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-sm">
                    # Show unlocked achievements<br/>
                    openconductor achievements<br/><br/>
                    # Show all achievements (including locked)<br/>
                    openconductor achievements --all<br/><br/>
                    # Alias: badges<br/>
                    openconductor badges
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    🎯 15 unlockable achievements across 5 categories: Installation, Stacks, Categories, Special, and Engagement
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Book className="h-5 w-5 mt-1" />
                    <div>
                      <h4 className="font-medium">Community</h4>
                      <p className="text-sm text-muted-foreground">
                        Join our Discord for questions and discussions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 mt-1" />
                    <div>
                      <h4 className="font-medium">GitHub</h4>
                      <p className="text-sm text-muted-foreground">
                        Report issues and contribute to development
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}