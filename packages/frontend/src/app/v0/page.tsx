import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, Sparkles, Code, Users, ExternalLink, CheckCircle } from 'lucide-react'

export default function V0IntegrationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="outline" className="ml-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none text-xs px-2 py-1">for v0</Badge>
          </div>
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/discover" className="text-sm hover:text-purple-600 transition-colors">
              Discover
            </Link>
            <Link href="/vercel" className="text-sm hover:text-purple-600 transition-colors">
              Vercel Integration
            </Link>
            <Link href="/supabase" className="text-sm hover:text-purple-600 transition-colors">
              Supabase Integration
            </Link>
            <Link href="/" className="text-sm hover:text-purple-600 transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none text-lg px-6 py-3">
              ✨ Build with v0. Orchestrate with OpenConductor.
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            AI agents that understand 
            <br />
            your v0 components
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            You generate components with v0. Now your AI agents can manage, modify, and enhance them. 
            From component generation to intelligent orchestration—complete your modern AI development workflow.
            <strong> Same intelligence. Same workflow. Complete integration.</strong>
          </p>
          
          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-4">
              <Sparkles className="mr-2 h-5 w-5" />
              Connect AI to v0 Workflow
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <a href="https://v0.dev" target="_blank" rel="noopener noreferrer">
                Open v0 Dashboard <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Integration Demo */}
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl mx-auto text-left shadow-2xl">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Code className="h-4 w-4" />
              <span className="text-sm">v0 + OpenConductor component workflow</span>
            </div>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-300">
                <span className="text-purple-400"># Generate components with v0</span>
              </div>
              <div className="text-gray-300">
                <span className="text-purple-400">→</span> Create dashboard component in v0
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> Component generated and exported
              </div>
              
              <div className="text-gray-300 mt-4">
                <span className="text-purple-400"># Connect AI agents to your components</span>
              </div>
              <div className="text-gray-300">
                <span className="text-purple-400">$</span> openconductor install filesystem-mcp react-mcp
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> AI agents understand your component structure
              </div>
              <div className="text-green-400 flex items-center gap-2">
                <span>✓</span> Can modify, enhance, and manage components
              </div>
              <div className="text-blue-300 flex items-center gap-2">
                <span>→</span> Intelligent component orchestration enabled
              </div>
            </div>
          </div>
        </section>

        {/* Integration Benefits */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">Why v0 + OpenConductor?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Intelligent Enhancement</h3>
                <p className="text-gray-600">
                  v0 generates the initial component. AI agents can iteratively improve, 
                  optimize, and adapt it based on usage patterns and requirements.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Code className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Component Understanding</h3>
                <p className="text-gray-600">
                  AI agents understand your component architecture, props, state management, 
                  and can make intelligent modifications that respect your patterns.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Workflow Integration</h3>
                <p className="text-gray-600">
                  From v0 generation to production deployment—AI agents manage the entire 
                  component lifecycle with the same intelligence as your design process.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Perfect for v0 Developers</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🎨 Component Enhancement</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that can take your v0-generated components and add accessibility, 
                  performance optimizations, and responsive design improvements.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install react-mcp accessibility-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">📋 Component Documentation</h3>
                <p className="text-gray-600 mb-4">
                  Automatically generate comprehensive documentation, prop types, 
                  and usage examples for your v0 components.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install documentation-mcp typescript-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🧪 Testing & Validation</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that understand your v0 components and generate appropriate 
                  tests, validate props, and check for potential issues.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install testing-mcp validation-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🔧 Component Refactoring</h3>
                <p className="text-gray-600 mb-4">
                  Intelligent refactoring that maintains component functionality while 
                  improving code structure, performance, and maintainability.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install refactor-mcp performance-mcp
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Integration */}
        <section className="bg-gradient-to-r from-purple-50 to-blue-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-8">Complete v0 Workflow</h2>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="grid md:grid-cols-4 gap-6 text-left">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-purple-700">1. Generate</h4>
                    <p className="text-sm text-gray-600">Create components with v0's AI-powered generation</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Terminal className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-blue-700">2. Orchestrate</h4>
                    <p className="text-sm text-gray-600">Connect AI agents with OpenConductor</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Code className="h-8 w-8 text-teal-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-teal-700">3. Enhance</h4>
                    <p className="text-sm text-gray-600">AI agents improve and optimize components</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-green-700">4. Deploy</h4>
                    <p className="text-sm text-gray-600">Production-ready components with intelligent management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Enhance Your v0 Workflow?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join v0 developers who are building intelligent component workflows with AI orchestration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-4">
                <Sparkles className="mr-2 h-5 w-5" />
                Enhance v0 Components
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
                <Link href="/discover">
                  Browse Component Agents <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <Link href="/vercel" className="hover:text-purple-600 transition-colors">
                → Vercel Integration
              </Link>
              <Link href="/supabase" className="hover:text-purple-600 transition-colors">
                → Supabase Integration
              </Link>
              <Link href="/basehub" className="hover:text-purple-600 transition-colors">
                → BaseHub Integration
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. Build with v0. Orchestrate with OpenConductor.</p>
        </div>
      </footer>
    </div>
  )
}