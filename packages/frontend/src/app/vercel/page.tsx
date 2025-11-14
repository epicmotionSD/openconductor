import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, Zap, Users, ExternalLink, CheckCircle } from 'lucide-react'

export default function VercelIntegrationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="outline" className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none text-xs px-2 py-1">for Vercel</Badge>
          </div>
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/discover" className="text-sm hover:text-blue-600 transition-colors">
              Discover
            </Link>
            <Link href="/v0" className="text-sm hover:text-blue-600 transition-colors">
              v0 Integration
            </Link>
            <Link href="/supabase" className="text-sm hover:text-blue-600 transition-colors">
              Supabase Integration
            </Link>
            <Link href="/" className="text-sm hover:text-blue-600 transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none text-lg px-6 py-3">
              🚀 Deploy with Vercel. Orchestrate with OpenConductor.
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Deploy AI agents alongside 
            <br />
            your Next.js applications
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The missing orchestration layer for Vercel developers. Deploy your Next.js apps with confidence, 
            knowing your AI agents integrate seamlessly with your deployment workflow.
            <strong> Same professionalism. Same workflow. Complete stack.</strong>
          </p>
          
          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
              <Terminal className="mr-2 h-5 w-5" />
              Install OpenConductor CLI
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
                Open Vercel Dashboard <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Integration Demo */}
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl mx-auto text-left shadow-2xl">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Terminal className="h-4 w-4" />
              <span className="text-sm">Complete Vercel + OpenConductor workflow</span>
            </div>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-300">
                <span className="text-blue-400"># Deploy your Next.js app</span>
              </div>
              <div className="text-gray-300">
                <span className="text-blue-400">$</span> vercel deploy
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> Deployed to production
              </div>
              
              <div className="text-gray-300 mt-4">
                <span className="text-blue-400"># Add AI orchestration</span>
              </div>
              <div className="text-gray-300">
                <span className="text-blue-400">$</span> openconductor install github-mcp filesystem-mcp
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> AI agents configured for your deployment
              </div>
              <div className="text-green-400 flex items-center gap-2">
                <span>✓</span> Ready to manage your Vercel projects with AI
              </div>
            </div>
          </div>
        </section>

        {/* Integration Benefits */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">Why Vercel + OpenConductor?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Same Workflow</h3>
                <p className="text-gray-600">
                  Deploy apps with <code>vercel deploy</code>. Deploy agents with <code>openconductor install</code>. 
                  One professional workflow for your entire stack.
                </p>
              </div>
              
              <div className="text-center p-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Production Ready</h3>
                <p className="text-gray-600">
                  Built for teams who deploy to production daily. AI agents with the same 
                  reliability and professionalism as your Vercel deployments.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Team Integration</h3>
                <p className="text-gray-600">
                  Your team already trusts Vercel for deployments. Now extend that trust 
                  to AI agent orchestration with the same professional tooling.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Perfect for Vercel Teams</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🚀 Deployment Automation</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that understand your Vercel deployments, manage GitHub repos, 
                  and automate your entire deployment pipeline.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install github-mcp vercel-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">📊 Project Management</h3>
                <p className="text-gray-600 mb-4">
                  Connect AI agents to your project files, documentation, and team workflows 
                  for intelligent project assistance.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install filesystem-mcp notion-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🔍 Analytics & Monitoring</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that analyze your Vercel analytics, monitor deployments, 
                  and provide intelligent insights about your applications.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install analytics-mcp monitoring-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🤖 Customer Support</h3>
                <p className="text-gray-600 mb-4">
                  Deploy AI agents that understand your application architecture 
                  and can provide intelligent customer support based on your deployments.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install support-mcp database-mcp
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Upgrade Your Vercel Workflow?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join Vercel teams who are deploying AI agents with the same professionalism as their applications.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <Terminal className="mr-2 h-5 w-5" />
                Start with OpenConductor
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
                <Link href="/discover">
                  Browse AI Agents <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <Link href="/v0" className="hover:text-blue-600 transition-colors">
                → v0 Integration
              </Link>
              <Link href="/supabase" className="hover:text-blue-600 transition-colors">
                → Supabase Integration
              </Link>
              <Link href="/basehub" className="hover:text-blue-600 transition-colors">
                → BaseHub Integration
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. The orchestration platform for modern AI development.</p>
        </div>
      </footer>
    </div>
  )
}