import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, Zap, Shield, Users, Star, Download, ExternalLink } from 'lucide-react'

export default function LaunchPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="secondary" className="ml-2">Launch Week!</Badge>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-sm hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#install" className="text-sm hover:text-blue-600 transition-colors">
              Install
            </Link>
            <Link href="/discover" className="text-sm hover:text-blue-600 transition-colors">
              Browse Servers
            </Link>
            <a href="https://github.com/openconductor/openconductor" className="text-sm hover:text-blue-600 transition-colors">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          {/* Launch Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-sm px-4 py-2">
              🚀 Launching Today - The npm for MCP Servers
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Discover & Install
            <br />
            MCP Servers in Seconds
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            OpenConductor is the missing registry and CLI for Model Context Protocol servers. 
            Find, install, and manage 127+ AI agent tools with professional developer experience.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
              <Terminal className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <Link href="/discover">
                Browse 127+ Servers <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Hero Demo */}
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl mx-auto text-left shadow-2xl">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Terminal className="h-4 w-4" />
              <span className="text-sm">Install any MCP server in 3 commands</span>
            </div>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-300">
                <span className="text-blue-400">$</span> npm install -g @openconductor/cli
              </div>
              <div className="text-gray-300">
                <span className="text-blue-400">$</span> openconductor discover "memory"
              </div>
              <div className="text-gray-300">
                <span className="text-blue-400">$</span> openconductor install openmemory
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-4">
                <span>✓</span> Added to Claude Desktop config
              </div>
              <div className="text-green-400 flex items-center gap-2">
                <span>✓</span> Port allocated automatically  
              </div>
              <div className="text-green-400 flex items-center gap-2">
                <span>✓</span> Ready to use in Claude!
              </div>
            </div>
          </div>

          {/* Launch Stats */}
          <div className="mt-16 grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">127+</div>
              <div className="text-gray-600">MCP Servers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">3 Seconds</div>
              <div className="text-gray-600">Average Install</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">Cross-Platform</div>
              <div className="text-gray-600">macOS, Windows, Linux</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">Open Source</div>
              <div className="text-gray-600">MIT Licensed</div>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section id="problem" className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                  The Problem We Solved
                </h2>
                <div className="space-y-4 text-gray-600 text-lg">
                  <p>There are <strong>100+ amazing MCP servers</strong> available, but most developers only use 2-3.</p>
                  <p><strong>Why?</strong> Because discovery is broken. Finding servers means:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Manually searching GitHub repositories</li>
                    <li>Reading installation docs for each server</li>
                    <li>Copy-pasting config into Claude Desktop</li>
                    <li>Debugging port conflicts and setup issues</li>
                    <li>Remembering to restart Claude Desktop</li>
                  </ul>
                  <p className="font-semibold text-gray-900">Setting up 5 servers took 3 days. It should take 3 minutes.</p>
                </div>
              </div>
              
              <div className="bg-red-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-red-700 mb-4">Before OpenConductor:</h3>
                <div className="space-y-3 text-red-600">
                  <div className="flex items-center gap-3">
                    <span className="text-red-500">❌</span>
                    <span>Manual server discovery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-500">❌</span>
                    <span>Complex installation process</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-500">❌</span>
                    <span>Port conflict debugging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-500">❌</span>
                    <span>Manual config file editing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-500">❌</span>
                    <span>Hours of setup time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="bg-green-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-green-100 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-green-700 mb-4">After OpenConductor:</h3>
                <div className="space-y-3 text-green-700">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✅</span>
                    <span>Search 127+ servers instantly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✅</span>
                    <span>One-command installation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✅</span>
                    <span>Automatic port allocation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✅</span>
                    <span>Zero config file editing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✅</span>
                    <span>Ready in 30 seconds</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                  Our Solution
                </h2>
                <div className="space-y-4 text-gray-600 text-lg">
                  <p><strong>OpenConductor</strong> makes MCP servers as easy to discover and install as npm packages.</p>
                  <p>We built the infrastructure the MCP ecosystem was missing:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Searchable registry</strong> of all available servers</li>
                    <li><strong>Professional CLI</strong> with beautiful, interactive experience</li>
                    <li><strong>Automatic configuration</strong> management for Claude Desktop</li>
                    <li><strong>Community verification</strong> for quality and security</li>
                    <li><strong>Real-time updates</strong> from GitHub repositories</li>
                  </ul>
                  <p className="font-semibold text-gray-900">Now you can focus on building AI agents instead of managing infrastructure.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">Why Developers Love OpenConductor</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
                <p className="text-gray-600">
                  Find any of 127+ servers in under a second. Install with one command. 
                  No configuration editing required.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Community Verified</h3>
                <p className="text-gray-600">
                  Verified servers are tested by the community. Quality ratings 
                  help you choose the best tools.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Developer First</h3>
                <p className="text-gray-600">
                  Built by developers, for developers. Beautiful CLI experience 
                  with progress tracking and helpful errors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Servers Preview */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Featured MCP Servers</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              The most popular servers in our registry
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "OpenMemory",
                  category: "🧠 Memory",
                  description: "Hierarchical memory for AI agents with semantic search",
                  stars: "1.6K",
                  installs: "847",
                  slug: "openmemory",
                  verified: true
                },
                {
                  name: "GitHub MCP", 
                  category: "🔌 API",
                  description: "Repository management, issues, and pull requests",
                  stars: "1.1K", 
                  installs: "672",
                  slug: "github-mcp",
                  verified: true
                },
                {
                  name: "PostgreSQL MCP",
                  category: "🗄️ Database", 
                  description: "Secure database queries and schema management",
                  stars: "654",
                  installs: "298", 
                  slug: "postgresql-mcp",
                  verified: true
                },
                {
                  name: "Filesystem MCP",
                  category: "📁 Files",
                  description: "Sandboxed file operations for AI agents",
                  stars: "892",
                  installs: "523",
                  slug: "filesystem-mcp", 
                  verified: true
                },
                {
                  name: "Slack MCP",
                  category: "💬 Communication",
                  description: "Workspace messaging and team automation",
                  stars: "789",
                  installs: "445",
                  slug: "slack-mcp",
                  verified: true
                },
                {
                  name: "Brave Search MCP",
                  category: "🔍 Search", 
                  description: "Privacy-focused web search capabilities",
                  stars: "445",
                  installs: "234",
                  slug: "brave-search-mcp",
                  verified: true
                }
              ].map((server) => (
                <div key={server.slug} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{server.name}</h3>
                    {server.verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="mb-3">
                    {server.category}
                  </Badge>
                  
                  <p className="text-gray-600 text-sm mb-4">{server.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {server.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {server.installs}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/servers/${server.slug}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="px-3">
                      <Terminal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link href="/discover">
                  Browse All 127+ Servers <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="install" className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-12">Get Started in 30 Seconds</h2>
            
            <div className="max-w-3xl mx-auto">
              <div className="bg-gray-900 rounded-xl p-8 text-left shadow-2xl">
                <div className="flex items-center gap-2 text-gray-400 mb-6">
                  <Terminal className="h-5 w-5" />
                  <span>Complete installation and first use</span>
                </div>
                
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-gray-300">
                    <span className="text-blue-400">$</span> npm install -g @openconductor/cli
                  </div>
                  <div className="text-gray-500 text-xs">→ Installs the OpenConductor CLI globally</div>
                  
                  <div className="text-gray-300 mt-6">
                    <span className="text-blue-400">$</span> openconductor discover "memory"
                  </div>
                  <div className="text-gray-500 text-xs">→ Search for memory-related MCP servers</div>
                  
                  <div className="text-gray-300 mt-6">
                    <span className="text-blue-400">$</span> openconductor install openmemory
                  </div>
                  <div className="text-gray-500 text-xs">→ Install OpenMemory with automatic configuration</div>
                  
                  <div className="mt-6 space-y-2">
                    <div className="text-green-400">✓ Package installed successfully</div>
                    <div className="text-green-400">✓ Added to Claude Desktop config</div>
                    <div className="text-green-400">✓ Port 8080 allocated</div>
                    <div className="text-green-400">✓ Configuration backed up</div>
                    <div className="text-blue-300">→ Restart Claude Desktop to use OpenMemory!</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                  <Terminal className="mr-2 h-5 w-5" />
                  Install CLI Now
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Requires Node.js 18+. Works on macOS, Windows, and Linux.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Story */}
        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8">Built by a Railroad Electrician</h2>
              
              <blockquote className="text-xl leading-relaxed mb-8">
                "I'm not a typical software engineer. I'm a railroad electrician who troubleshoots 
                $10M locomotives. Last week I spent 2 hours tracing a faulty IGBT inverter through 
                40-year-old schematics. So I built an AI agent to do it in 10 minutes."
              </blockquote>
              
              <blockquote className="text-xl leading-relaxed mb-8">
                "That agent uses 5 MCP servers. Setting them up took 3 days. 
                So I built OpenConductor to make it take 3 minutes."
              </blockquote>
              
              <p className="text-lg opacity-90">
                <strong>Real problems. Real solutions. Real developer tools.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Supercharge Your AI Agents?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join hundreds of developers who are building the future of AI agent infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <Terminal className="mr-2 h-5 w-5" />
                Install OpenConductor
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
                <a href="https://github.com/openconductor/openconductor" target="_blank">
                  <Star className="mr-2 h-5 w-5" />
                  Star on GitHub
                </a>
              </Button>
            </div>

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <a href="https://discord.gg/openconductor" className="hover:text-blue-600 transition-colors">
                💬 Join Discord
              </a>
              <a href="https://github.com/openconductor/openconductor" className="hover:text-blue-600 transition-colors">
                📚 Documentation
              </a>
              <a href="mailto:hello@openconductor.ai" className="hover:text-blue-600 transition-colors">
                📧 Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. MIT Licensed. Built for the MCP community.</p>
          <p className="mt-2">
            <a href="https://modelcontextprotocol.io" className="hover:text-blue-600 transition-colors">
              Learn about the Model Context Protocol
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}