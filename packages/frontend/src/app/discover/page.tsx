'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GradientText } from '@/components/ui/gradient-text'
import { GlassCard } from '@/components/ui/glass-card'
import { GradientButton } from '@/components/ui/gradient-button'
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
        limit: 500
      }

      const queryString = new URLSearchParams()
      if (params.query) queryString.append('query', params.query)
      if (params.category) queryString.append('category', params.category)
      if (params.verified) queryString.append('verified', 'true')
      if (params.limit) queryString.append('limit', params.limit.toString())
      if (selectedTags.length > 0) queryString.append('tags', selectedTags.join(','))
      if (sortBy) queryString.append('sortBy', sortBy)

      // Try local API first, fallback to empty for now (database connection needed)
      const apiUrl = '/api/v1'
      const response = await fetch(`${apiUrl}/servers?${queryString.toString()}`)

      if (!response.ok) {
        console.warn('Local API not available, showing empty state')
        setServers([])
        return
      }

      const result = await response.json()

      if (result.success) {
        setServers(result.data.servers)
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
      // Show empty state when API fails
      setServers([])
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
            <h1 className="text-4xl font-bold">
              Discover <GradientText>MCP Servers</GradientText>
            </h1>
            <Badge className="bg-gradient-primary text-white border-none text-sm px-3 py-1 shadow-glow-purple">
              {servers.length || '220+'} Servers
            </Badge>
          </div>
          <p className="text-lg text-foreground-secondary max-w-3xl">
            Browse and search through our registry of Model Context Protocol servers. Find tools for file management, databases, APIs, and more to supercharge Claude's capabilities.
          </p>
        </div>

        {/* Search and Filters */}
        <GlassCard className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
              <Input
                type="text"
                placeholder="Search servers by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background-surface border-primary/20"
              />
            </div>
            <GradientButton type="submit">Search</GradientButton>
          </form>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-primary/20 bg-background-surface rounded-md text-sm text-foreground"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-primary/20 bg-background-surface rounded-md text-sm text-foreground"
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="installs">Sort: Most Installs</option>
                <option value="newest">Sort: Newest</option>
                <option value="alphabetical">Sort: A-Z</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  className="accent-primary"
                />
                Verified only
              </label>

              {(selectedCategory || showVerifiedOnly || selectedTags.length > 0 || sortBy !== 'popularity') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="border-primary/20 hover:border-primary/40"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Tag Selection */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Filter by tags:</div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={selectedTags.includes(tag)
                      ? "cursor-pointer bg-gradient-primary text-white hover:opacity-90 transition-smooth border-none"
                      : "cursor-pointer hover:bg-primary/10 transition-smooth border-primary/20"}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="text-sm text-foreground-secondary">
                  Selected: {selectedTags.join(', ')}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground-secondary">Searching servers...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">
                <GradientText>{servers.length}</GradientText> server{servers.length !== 1 ? 's' : ''} found
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>

            {servers.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2 text-foreground">No servers found</h3>
                <p className="text-foreground-secondary mb-4">
                  Try adjusting your search criteria
                </p>
                <GradientButton onClick={clearAllFilters}>
                  Clear Filters
                </GradientButton>
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
    <GlassCard className="h-full flex flex-col hover:border-primary/50 transition-smooth">
      <div className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-4">
          <h3 className="text-lg leading-tight font-semibold">
            <Link
              href={`/servers/${server.slug}`}
              className="hover:text-primary transition-colors"
            >
              {server.name}
            </Link>
          </h3>
          {server.verified && (
            <Badge className="text-xs flex-shrink-0 bg-success text-white border-none">
              ✓ Verified
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {/* Description - clearly visible */}
        <p className="text-sm text-foreground-secondary mb-4 line-clamp-2 min-h-[2.5rem]">
          {server.description}
        </p>

        <div className="space-y-3 mt-auto">
          {/* Category */}
          <div className="flex items-center gap-2">
            <CategoryBadge category={server.category as MCPCategory} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-foreground-secondary">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-warning" />
              <span>{server.repository?.stars || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3 text-primary" />
              <span>{server.stats?.installs || 0}</span>
            </div>
          </div>

          {/* Tags */}
          {server.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {server.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-primary/20 text-foreground-secondary">
                  {tag}
                </Badge>
              ))}
              {server.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-primary/20 text-foreground-secondary">
                  +{server.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <GradientButton asChild size="sm" className="flex-1">
              <Link href={`/servers/${server.slug}`}>
                View Details
              </Link>
            </GradientButton>
            <Button variant="outline" size="sm" asChild className="border-primary/20 hover:border-primary/40">
              <a href={server.repository.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}