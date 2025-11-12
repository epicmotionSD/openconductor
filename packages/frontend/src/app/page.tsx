import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, Zap, Shield, Users, Star, Download } from 'lucide-react'

export default function HomePage() {
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
            OpenConductor is the missing registry and CLI for the Model Context Protocol.
            It's the <strong>npm for AI agents</strong>, letting you find, install, and manage 127+ tools with a professional developer experience.
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
                <h3 className="text-xl font-semibold mb-4">Built for Your Workflow</h3>
                <p className="text-gray-600">
                  Beautiful CLI experience with progress tracking, helpful errors,
                  and seamless integration with your existing tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="install" className="bg-gray-50 py-20">
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
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Supercharge Your AI Agents?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join developers from around the world building the future of AI agent infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <Terminal className="mr-2 h-5 w-5" />
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
                <a href="https://github.com/openconductor/openconductor" target="_blank">
                  <Star className="mr-2 h-5 w-5" />
                  Star on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. MIT Licensed. Built for the MCP community.</p>
        </div>
      </footer>
    </div>
  )
}