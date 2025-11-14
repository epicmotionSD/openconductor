import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Terminal, FileText, Search, Users, ExternalLink, CheckCircle } from 'lucide-react'

export default function BaseHubIntegrationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="outline" className="ml-2 bg-gradient-to-r from-orange-600 to-purple-600 text-white border-none text-xs px-2 py-1">for BaseHub</Badge>
          </div>
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/discover" className="text-sm hover:text-orange-600 transition-colors">
              Discover
            </Link>
            <Link href="/vercel" className="text-sm hover:text-orange-600 transition-colors">
              Vercel Integration
            </Link>
            <Link href="/supabase" className="text-sm hover:text-orange-600 transition-colors">
              Supabase Integration
            </Link>
            <Link href="/" className="text-sm hover:text-orange-600 transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="bg-gradient-to-r from-orange-600 to-purple-600 text-white border-none text-lg px-6 py-3">
              📝 Content in BaseHub. Intelligence in OpenConductor.
            </Badge>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI agents that understand
            <br />
            your content structure
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            You manage content in BaseHub. Now your AI agents can intelligently work with it. 
            From content analysis to automated workflows—connect your content layer with AI orchestration.
            <strong> Same content. Same structure. Intelligent automation.</strong>
          </p>
          
          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4">
              <FileText className="mr-2 h-5 w-5" />
              Connect AI to BaseHub
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <a href="https://basehub.com" target="_blank" rel="noopener noreferrer">
                Open BaseHub Dashboard <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Integration Demo */}
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl mx-auto text-left shadow-2xl">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <FileText className="h-4 w-4" />
              <span className="text-sm">BaseHub + OpenConductor content workflow</span>
            </div>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-300">
                <span className="text-orange-400"># Your content lives in BaseHub</span>
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400">→</span> Structured content, rich media, localization
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> Content managed professionally
              </div>
              
              <div className="text-gray-300 mt-4">
                <span className="text-orange-400"># Connect AI agents to your content</span>
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400">$</span> openconductor install basehub-mcp content-mcp
              </div>
              <div className="text-green-400 flex items-center gap-2 mt-2">
                <span>✓</span> AI agents understand your content schema
              </div>
              <div className="text-green-400 flex items-center gap-2">
                <span>✓</span> Can analyze, modify, and enhance content
              </div>
              <div className="text-blue-300 flex items-center gap-2">
                <span>→</span> Intelligent content workflows enabled
              </div>
            </div>
          </div>
        </section>

        {/* Integration Benefits */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">Why BaseHub + OpenConductor?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <FileText className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Content Intelligence</h3>
                <p className="text-gray-600">
                  AI agents understand your BaseHub schema, content relationships, 
                  and can provide intelligent content analysis and recommendations.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Search className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Smart Content Operations</h3>
                <p className="text-gray-600">
                  Automated content workflows that respect your BaseHub structure—
                  from SEO optimization to content validation and enhancement.
                </p>
              </div>
              
              <div className="text-center p-6">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Team Collaboration</h3>
                <p className="text-gray-600">
                  AI agents work within your content workflow, supporting editors 
                  and content teams with intelligent assistance and automation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">Perfect for BaseHub Teams</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">📊 Content Analytics</h3>
                <p className="text-gray-600 mb-4">
                  AI agents that analyze your BaseHub content performance, 
                  identify trends, and provide recommendations for optimization.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install analytics-mcp basehub-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🔍 SEO Optimization</h3>
                <p className="text-gray-600 mb-4">
                  Automated SEO analysis and optimization for your BaseHub content, 
                  ensuring maximum discoverability and search performance.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install seo-mcp content-analysis-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">🌐 Localization Support</h3>
                <p className="text-gray-600 mb-4">
                  AI-powered translation and localization workflows that understand 
                  your BaseHub content structure and maintain consistency.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install translation-mcp localization-mcp
                </code>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">✅ Content Validation</h3>
                <p className="text-gray-600 mb-4">
                  Intelligent content quality checks, style guide enforcement, 
                  and automated proofreading for your BaseHub publications.
                </p>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  openconductor install validation-mcp proofreading-mcp
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Content Workflow */}
        <section className="bg-gradient-to-r from-orange-50 to-purple-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-8">Complete Content Workflow</h2>
              
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="grid md:grid-cols-4 gap-6 text-left">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-orange-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-orange-700">1. Create</h4>
                    <p className="text-sm text-gray-600">Manage content structure in BaseHub</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Terminal className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-purple-700">2. Connect</h4>
                    <p className="text-sm text-gray-600">Link AI agents with OpenConductor</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-blue-700">3. Analyze</h4>
                    <p className="text-sm text-gray-600">AI agents provide intelligent insights</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-green-700">4. Optimize</h4>
                    <p className="text-sm text-gray-600">Automated content enhancement and optimization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Integration */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-12">Technical Integration</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-orange-700">🔌 API Integration</h3>
                  <p className="text-gray-600 mb-4">
                    Direct integration with BaseHub's GraphQL API, allowing AI agents 
                    to query, modify, and manage your content programmatically.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Real-time content synchronization</li>
                    <li>• Respect for content permissions</li>
                    <li>• Webhook support for content changes</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-purple-700">📋 Schema Understanding</h3>
                  <p className="text-gray-600 mb-4">
                    AI agents automatically understand your BaseHub content models, 
                    field types, and relationships for intelligent content operations.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Automatic schema discovery</li>
                    <li>• Content validation rules</li>
                    <li>• Relationship mapping</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6">Ready to Enhance Your Content Workflow?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join BaseHub teams who are building intelligent content workflows with AI orchestration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4">
                <FileText className="mr-2 h-5 w-5" />
                Enhance BaseHub Content
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
                <Link href="/discover">
                  Browse Content Agents <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <Link href="/vercel" className="hover:text-orange-600 transition-colors">
                → Vercel Integration
              </Link>
              <Link href="/v0" className="hover:text-orange-600 transition-colors">
                → v0 Integration
              </Link>
              <Link href="/supabase" className="hover:text-orange-600 transition-colors">
                → Supabase Integration
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 OpenConductor. Content in BaseHub. Intelligence in OpenConductor.</p>
        </div>
      </footer>
    </div>
  )
}