'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Star, Download, ExternalLink, Filter } from 'lucide-react'
import { AlertBox } from '@/components/ui/alert-box'
import { CategoryBadge, MCPCategory } from '@/components/ui/category-badge'
import { SiteHeader } from '@/components/navigation/site-header'
import type { MCPServer, MCPServerSearchParams, MCPServerSearchResult } from '../../types'

export default function DiscoverPage() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popularity' | 'newest' | 'alphabetical' | 'installs'>('popularity')
  const [showFilters, setShowFilters] = useState(false)

  const categories = ['memory', 'filesystem', 'database', 'api', 'custom']

  // Popular tags for quick filtering
  const popularTags = [
    'ai', 'api', 'automation', 'database', 'development', 'analytics',
    'cloud', 'search', 'integration', 'data', 'productivity', 'communication'
  ]

  useEffect(() => {
    searchServers()
  }, [searchQuery, selectedCategory, showVerifiedOnly, selectedTags, sortBy])

  const searchServers = async () => {
    setLoading(true)
    try {
      const params: MCPServerSearchParams = {
        query: searchQuery || undefined,
        category: selectedCategory as any || undefined,
        verified: showVerifiedOnly || undefined,
        limit: 100
      }

      const queryString = new URLSearchParams()
      if (params.query) queryString.append('query', params.query)
      if (params.category) queryString.append('category', params.category)
      if (params.verified) queryString.append('verified', 'true')
      if (params.limit) queryString.append('limit', params.limit.toString())
      if (selectedTags.length > 0) queryString.append('tags', selectedTags.join(','))
      if (sortBy) queryString.append('sortBy', sortBy)

      // Use the configured API URL which already includes /v1
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
      const response = await fetch(`${apiUrl}/servers?${queryString.toString()}`)
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

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setShowVerifiedOnly(false)
    setSelectedTags([])
    setSortBy('popularity')
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="minimal" />

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
          <AlertBox variant="info" icon={<span className="text-lg">🎯</span>} title="Ecosystem Integration">
            Works with your modern AI stack out of the box.
            Deploy with Vercel, build with v0, query Supabase, orchestrate with OpenConductor.
          </AlertBox>
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
          <div className="space-y-4">
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

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="installs">Sort: Most Installs</option>
                <option value="newest">Sort: Newest</option>
                <option value="alphabetical">Sort: A-Z</option>
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                />
                Verified only
              </label>

              {(selectedCategory || showVerifiedOnly || selectedTags.length > 0 || sortBy !== 'popularity') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Tag Selection */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Filter by tags:</div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90 transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedTags.join(', ')}
                </div>
              )}
            </div>
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
                <Button onClick={clearAllFilters}>
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
            <CategoryBadge category={server.category as MCPCategory} />
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