import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, Database, Shield, Users, ExternalLink, CheckCircle } from 'lucide-react'

export default function SupabaseIntegrationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="outline" className="ml-2 bg-gradient-to-r from-green-600 to-blue-600 text-white border-none text-xs px-2 py-1">for Supabase</Badge>
          </div>
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/discover" className="text-sm hover:text-green-600 transition-colors">
              Discover
            </Link>
            <Link href="/vercel" className="text-sm hover:text-green-600 transition-colors">
              Vercel Integration
            </Link>
            <Link href="/v0" className="text-sm hover:text-green-600 transition-colors">
              v0 Integration
            </Link>
            <Link href="/" className="text-sm hover:text-green-600 transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-none text-lg px-6 py-3">
              🗄️ Your data layer meets your AI agents
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Connect AI agents to 
            <br />
            your Supabase database
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your applications query Supabase. Now your AI agents can too. 
            One unified data layer for your entire stack—applications, agents, and automation.
            <strong> Same database. Same permissions. Complete integration.</strong>
          </p>
          
          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
              <Terminal className="mr-2 h-5 w-5" />
              Connect AI to Supabase
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                Open Supabase Dashboard <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Integration Demo */}
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl mx-auto text-left shadow-2xl">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Database className="h-4 w-4" />
              <span className="text-sm">Supabase + OpenConductor integration</span>
            </div>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-300">
                <span className="text-green-400"># Your app queries Supabase</span>
              </div>
              <div className="text-gray-300">
                <span className="text-green-400">$</span> supabase db push
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> Database schema deployed
              </div>
              
              <div className="text-gray-300 mt-4">
                <span className="text-green-400"># Connect AI agents to the same data</span>
              </div>
              <div className="text-gray-300">
                <span className="text-green-400">$</span> openconductor install postgresql-mcp supabase-mcp
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> AI agents connected to your database
              </div>
              <div className="text-green-400 flex items-center gap-2">
                <span>✓</span> Same permissions, same security model
              </div>
              <div className="text-blue-300 flex items-center gap-2">
                <span>→</span> Your agents understand your data structure
              </div>
            </div>
          </div>
        </section>

        {/* Integration Benefits */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">Why Supabase + OpenConductor?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <Database className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Unified Data Layer</h3>
                <p className="text-gray-600">
                  One database for your applications and AI agents. No data duplication, 
                  no synchronization issues. Just unified access to your data.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Same Security Model</h3>
                <p className="text-gray-600">
                  AI agents respect your Supabase Row Level Security policies. 
                  The same permissions and security you trust for your applications.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Team Collaboration</h3>
                <p className="text-gray-600">
                  Your team already manages data in Supabase. Now manage AI agent 
                  access with the same collaborative tools and workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Perfect for Supabase Teams</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">📊 Data Analysis</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that understand your database schema and can provide 
                  intelligent insights about your data, users, and application performance.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install postgresql-mcp analytics-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🤖 Customer Support</h3>
                <p className="text-gray-600 mb-4">
                  Support agents powered by AI that can query your user data, 
                  order history, and application state directly from Supabase.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install supabase-mcp support-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">⚡ Real-time Automation</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that respond to Supabase real-time events, 
                  automatically processing data changes and triggering workflows.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install realtime-mcp webhook-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🔍 Content Management</h3>
                <p className="text-gray-600 mb-4">
                  AI-powered content moderation and management that works directly 
                  with your Supabase tables and storage buckets.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install content-mcp storage-mcp
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Integration */}
        <section className="bg-gradient-to-r from-green-50 to-blue-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-8">Technical Integration</h2>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-left">How it Works</h3>
                
                <div className="grid md:grid-cols-2 gap-8 text-left">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">🔗 Direct Database Connection</h4>
                    <p className="text-gray-600 mb-4">
                      AI agents connect directly to your Supabase PostgreSQL instance 
                      using the same connection strings and authentication as your applications.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">🛡️ Security & Permissions</h4>
                    <p className="text-gray-600 mb-4">
                      Respects your existing Row Level Security policies and user permissions. 
                      AI agents operate within your established security framework.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-purple-700">⚡ Real-time Capabilities</h4>
                    <p className="text-gray-600 mb-4">
                      Integrate with Supabase real-time subscriptions for AI agents 
                      that respond instantly to database changes.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-700">📦 Storage Integration</h4>
                    <p className="text-gray-600 mb-4">
                      AI agents can access and manage your Supabase Storage buckets, 
                      handling file uploads, transformations, and content analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Connect Your Data Layer?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join Supabase teams who are building AI-powered applications with unified data access.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
                <Terminal className="mr-2 h-5 w-5" />
                Connect to Supabase
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
                <Link href="/discover">
                  Browse Database Agents <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <Link href="/vercel" className="hover:text-green-600 transition-colors">
                → Vercel Integration
              </Link>
              <Link href="/v0" className="hover:text-green-600 transition-colors">
                → v0 Integration
              </Link>
              <Link href="/basehub" className="hover:text-green-600 transition-colors">
                → BaseHub Integration
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. Your data layer meets your AI agents.</p>
        </div>
      </footer>
    </div>
  )
}