'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Github, Terminal, CheckCircle, AlertCircle, Zap } from 'lucide-react'

export default function SubmitServerPage() {
  const [formData, setFormData] = useState({
    repositoryUrl: '',
    name: '',
    category: '',
    tags: '',
    npmPackage: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    { id: 'memory', name: '🧠 Memory & State', description: 'Long-term memory and state management' },
    { id: 'filesystem', name: '📁 File System', description: 'File and document management' },
    { id: 'database', name: '🗄️ Database', description: 'Database integration and queries' },
    { id: 'api', name: '🔌 API Integration', description: 'External API and service integrations' },
    { id: 'search', name: '🔍 Search', description: 'Search and information retrieval' },
    { id: 'communication', name: '💬 Communication', description: 'Messaging and communication tools' },
    { id: 'monitoring', name: '📊 Monitoring', description: 'System monitoring and observability' },
    { id: 'development', name: '⚒️ Development', description: 'Development tools and utilities' },
    { id: 'custom', name: '🔧 Custom', description: 'Custom and specialized integrations' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      // Validate form
      const validationErrors: Record<string, string> = {}
      
      if (!formData.repositoryUrl) {
        validationErrors.repositoryUrl = 'GitHub repository URL is required'
      } else if (!formData.repositoryUrl.includes('github.com')) {
        validationErrors.repositoryUrl = 'Must be a GitHub repository URL'
      }

      if (!formData.category) {
        validationErrors.category = 'Please select a category'
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setSubmitting(false)
        return
      }

      // Submit to API
      const response = await fetch('/v1/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repositoryUrl: formData.repositoryUrl,
          name: formData.name || undefined,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
          npmPackage: formData.npmPackage || undefined
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const errorData = await response.json()
        setErrors({ general: errorData.error?.message || 'Submission failed' })
      }

    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Terminal className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">OpenConductor</span>
              <Badge variant="secondary" className="ml-2">Enterprise</Badge>
            </Link>
            <nav className="flex space-x-6">
              <Link href="/discover" className="text-sm hover:text-blue-600">Discover</Link>
              <Link href="/submit" className="text-sm text-blue-600">Submit</Link>
              <Link href="/admin" className="text-sm hover:text-blue-600">Admin</Link>
            </nav>
          </div>
        </header>

        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-6">Server Submitted Successfully!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for contributing to the MCP ecosystem! Your server will be reviewed and indexed within 24 hours.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Automated GitHub sync validates your repository</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Community review for quality and security</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Server indexed and made discoverable</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Real-time updates from your repository</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/discover">
                  Browse Servers
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/submit">
                  Submit Another
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">Enterprise</Badge>
          </Link>
          <nav className="flex space-x-6">
            <Link href="/discover" className="text-sm hover:text-blue-600">Discover</Link>
            <Link href="/submit" className="text-sm text-blue-600 font-medium">Submit</Link>
            <Link href="/admin" className="text-sm hover:text-blue-600">Admin</Link>
          </nav>
        </div>
      </header>

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
          <h1 className="text-4xl font-bold mb-4">Submit Your MCP Server</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Add your Model Context Protocol server to the registry and make it discoverable 
            to thousands of developers. Powered by enterprise-grade automation.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Discovery</h3>
            <p className="text-gray-600">
              Your server becomes searchable and installable with one command
            </p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Github className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-gray-600">
              Automatic updates from releases, stars, and repository changes
            </p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Community Verified</h3>
            <p className="text-gray-600">
              Quality review process ensures high standards for all users
            </p>
          </div>
        </div>

        {/* Submission Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Repository URL */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GitHub Repository URL *
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username/my-mcp-server"
                    value={formData.repositoryUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, repositoryUrl: e.target.value }))}
                    className={errors.repositoryUrl ? 'border-red-500' : ''}
                  />
                  {errors.repositoryUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.repositoryUrl}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    We'll automatically fetch metadata from your repository
                  </p>
                </div>

                {/* Server Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Server Name (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Auto-detected from repository if not provided"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map(cat => (
                      <div 
                        key={cat.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          formData.category === cat.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      >
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-sm text-gray-600">{cat.description}</div>
                      </div>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="memory, semantic, ai-agents (comma-separated)"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Help users find your server with relevant tags
                  </p>
                </div>

                {/* NPM Package */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    NPM Package (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="@your-org/your-mcp-server"
                    value={formData.npmPackage}
                    onChange={(e) => setFormData(prev => ({ ...prev, npmPackage: e.target.value }))}
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    If published to npm, provide the package name for easier installation
                  </p>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Submission Error</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">{errors.general}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Submit Server
                      </>
                    )}
                  </Button>
                  
                  <Button type="button" variant="outline" asChild>
                    <Link href="/discover">
                      Cancel
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Submission Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Valid MCP Server Implementation</div>
                  <div className="text-sm text-gray-600">
                    Must implement the Model Context Protocol specification
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Clear Installation Instructions</div>
                  <div className="text-sm text-gray-600">
                    README with installation steps and usage examples
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Open Source (Preferred)</div>
                  <div className="text-sm text-gray-600">
                    MIT, Apache, or similar license for community use
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Active Maintenance</div>
                  <div className="text-sm text-gray-600">
                    Recent commits and responsive to issues
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-8 text-center text-gray-600">
            <p className="mb-4">
              <strong>New to MCP?</strong> Learn how to build MCP servers in our{' '}
              <Link href="/docs" className="text-blue-600 hover:underline">
                documentation
              </Link>
            </p>
            <p>
              Questions? Join our{' '}
              <a href="https://discord.gg/openconductor" className="text-blue-600 hover:underline">
                Discord community
              </a>{' '}
              for help and support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">Enterprise</Badge>
          </Link>
          <nav className="flex space-x-6">
            <Link href="/discover" className="text-sm hover:text-blue-600">Discover</Link>
            <Link href="/submit" className="text-sm text-blue-600 font-medium">Submit</Link>
            <Link href="/admin" className="text-sm hover:text-blue-600">Admin</Link>
          </nav>
        </div>
      </header>

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
          <h1 className="text-4xl font-bold mb-4">Submit Your MCP Server</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Add your Model Context Protocol server to the registry and make it discoverable 
            to thousands of developers. Enterprise automation handles the rest.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Discovery</h3>
            <p className="text-gray-600">
              Your server becomes searchable and installable with one command
            </p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Github className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-gray-600">
              Automatic updates from releases, stars, and repository changes
            </p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Community Verified</h3>
            <p className="text-gray-600">
              Quality review process ensures high standards for all users
            </p>
          </div>
        </div>

        {/* Submission Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form content from above goes here - truncated for brevity */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GitHub Repository URL *
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username/my-mcp-server"
                    value={formData.repositoryUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, repositoryUrl: e.target.value }))}
                    className={errors.repositoryUrl ? 'border-red-500' : ''}
                  />
                  {errors.repositoryUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.repositoryUrl}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Server'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}