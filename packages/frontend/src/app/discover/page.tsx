'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Star, Download, ExternalLink, Filter } from 'lucide-react'
import type { MCPServer, MCPServerSearchParams, MCPServerSearchResult } from '../../types'

export default function DiscoverPage() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  const categories = ['memory', 'filesystem', 'database', 'api', 'custom']

  useEffect(() => {
    searchServers()
  }, [searchQuery, selectedCategory, showVerifiedOnly])

  const searchServers = async () => {
    setLoading(true)
    try {
      const params: MCPServerSearchParams = {
        query: searchQuery || undefined,
        category: selectedCategory as any || undefined,
        verified: showVerifiedOnly || undefined,
        limit: 20
      }

      const queryString = new URLSearchParams()
      if (params.query) queryString.append('query', params.query)
      if (params.category) queryString.append('category', params.category)
      if (params.verified) queryString.append('verified', 'true')
      if (params.limit) queryString.append('limit', params.limit.toString())

      // Fix API URL to avoid double /v1 and use direct IP
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'
      const response = await fetch(`${apiUrl}/v1/servers?${queryString.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setServers(result.data.servers)
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchServers()
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
            <Link href="/docs" className="text-sm hover:text-primary">Docs</Link>
            <Link href="/install" className="text-sm hover:text-primary">Install CLI</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">Discover AI Agents for Your Stack</h1>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none text-sm px-3 py-1">
              60+ Integrations
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Deploy agents alongside your components. Find MCP servers designed for Vercel, v0, Supabase, and BaseHub developers.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              🎯 <strong>Ecosystem Integration:</strong> Works with your modern AI stack out of the box.
              Deploy with Vercel, build with v0, query Supabase, orchestrate with OpenConductor.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search servers by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
              />
              Verified only
            </label>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Searching servers...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {servers.length} server{servers.length !== 1 ? 's' : ''} found
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>

            {servers.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No servers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria
                </p>
                <Button onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                  setShowVerifiedOnly(false)
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ServerCard({ server }: { server: MCPServer }) {
  const categoryColors: Record<string, string> = {
    memory: 'bg-blue-100 text-blue-800',
    filesystem: 'bg-green-100 text-green-800',
    database: 'bg-yellow-100 text-yellow-800',
    api: 'bg-purple-100 text-purple-800',
    search: 'bg-orange-100 text-orange-800',
    communication: 'bg-pink-100 text-pink-800',
    monitoring: 'bg-cyan-100 text-cyan-800',
    development: 'bg-indigo-100 text-indigo-800',
    custom: 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <Link 
              href={`/servers/${server.slug}`}
              className="hover:text-primary"
            >
              {server.name}
            </Link>
          </CardTitle>
          {server.verified && (
            <Badge variant="secondary" className="text-xs">
              ✓ Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {server.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={categoryColors[server.category]}
            >
              {server.category}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {server.repository?.stars || 0}
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {server.stats?.installs || 0}
            </div>
          </div>

          {server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {server.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {server.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{server.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/servers/${server.slug}`}>
                View Details
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={server.repository.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}