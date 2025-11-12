'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Star, Download, ExternalLink, Copy, CheckCircle, Terminal, Book } from 'lucide-react'
import type { MCPServer } from '../../types'

export default function ServerDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [server, setServer] = useState<MCPServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetchServer()
  }, [slug])

  const fetchServer = async () => {
    try {
      // Use new enterprise API endpoint
      const response = await fetch(`http://localhost:3001/v1/servers/${slug}`)
      const result = await response.json()
      
      if (result.success) {
        setServer(result.data)
      }
    } catch (error) {
      console.error('Error fetching server:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading server details...</p>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Server Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested MCP server could not be found.</p>
          <Button asChild>
            <Link href="/discover">Browse All Servers</Link>
          </Button>
        </div>
      </div>
    )
  }

  const categoryColors = {
    memory: 'bg-blue-100 text-blue-800',
    filesystem: 'bg-green-100 text-green-800',
    database: 'bg-yellow-100 text-yellow-800',
    api: 'bg-purple-100 text-purple-800',
    custom: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">OpenConductor</span>
          </Link>
          <nav className="flex space-x-6">
            <Link href="/discover" className="text-sm hover:text-primary">Discover</Link>
            <Link href="/docs" className="text-sm hover:text-primary">Docs</Link>
            <Link href="/install" className="text-sm hover:text-primary">Install CLI</Link>
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{server.name}</h1>
                  <p className="text-xl text-muted-foreground">{server.description}</p>
                </div>
                {server.verified && (
                  <Badge variant="secondary" className="ml-4">
                    ✓ Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Badge className={categoryColors[server.category]}>
                  {server.category}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  {server.stats.githubStars} stars
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  {server.stats.npmDownloads} downloads
                </div>
              </div>

              {server.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {server.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Installation Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Quick Install
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Using OpenConductor CLI</h4>
                  <div className="bg-muted rounded-md p-4 font-mono text-sm relative">
                    <code>openconductor install {server.slug}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                      onClick={() => copyToClipboard(`openconductor install ${server.slug}`, 'cli')}
                    >
                      {copied === 'cli' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {server.installation?.npm && (
                  <div>
                    <h4 className="font-medium mb-2">Manual Installation</h4>
                    <div className="bg-muted rounded-md p-4 font-mono text-sm relative">
                      <code>{server.installation.npm}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                        onClick={() => copyToClipboard(server.installation?.npm || '', 'npm')}
                      >
                        {copied === 'npm' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {server.installation?.docker && (
                  <div>
                    <h4 className="font-medium mb-2">Docker</h4>
                    <div className="bg-muted rounded-md p-4 font-mono text-sm relative">
                      <code>{server.installation.docker}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                        onClick={() => copyToClipboard(server.installation?.docker || '', 'docker')}
                      >
                        {copied === 'docker' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration Example */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Claude Desktop Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Add this configuration to your Claude Desktop config file:
                </p>
                <div className="bg-muted rounded-md p-4 relative">
                  <pre className="text-sm overflow-x-auto">
                    <code>{JSON.stringify({
                      mcpServers: {
                        [server.name.toLowerCase()]: server.configExample
                      }
                    }, null, 2)}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-8 w-8 p-0"
                    onClick={() => copyToClipboard(JSON.stringify({
                      mcpServers: {
                        [server.name.toLowerCase()]: server.configExample
                      }
                    }, null, 2), 'config')}
                  >
                    {copied === 'config' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <a href={server.repository} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Repository
                  </a>
                </Button>
                
                {server.npmPackage && (
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href={`https://www.npmjs.com/package/${server.npmPackage}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      NPM Package
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">GitHub Stars</span>
                  <span className="font-medium">{server.stats.githubStars}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">NPM Downloads</span>
                  <span className="font-medium">{server.stats.npmDownloads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(server.stats.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="outline">{server.category}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Related Servers */}
            <Card>
              <CardHeader>
                <CardTitle>Related Servers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discover more {server.category} servers
                </p>
                <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                  <Link href={`/discover?category=${server.category}`}>
                    Browse {server.category} servers
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}