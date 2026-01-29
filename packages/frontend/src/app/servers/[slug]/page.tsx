'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GradientText } from '@/components/ui/gradient-text'
import { GlassCard } from '@/components/ui/glass-card'
import { GradientButton } from '@/components/ui/gradient-button'
import { CategoryBadge, type MCPCategory } from '@/components/ui/category-badge'
import { UpgradeCard } from '@/components/ui/upgrade-card'
import { SiteHeader } from '@/components/navigation/site-header'
import { ArrowLeft, Star, Download, ExternalLink, Copy, CheckCircle, Terminal, Book, XCircle, Sparkles, Zap } from 'lucide-react'
import type { MCPServer } from '../../../types'

export default function ServerDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const checkoutStatus = searchParams.get('checkout')
  const [server, setServer] = useState<MCPServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetchServer()
  }, [slug])

  const fetchServer = async () => {
    try {
      // Use frontend's own API endpoint (relative URL)
      const response = await fetch(`/api/v1/servers/${slug}`)
      const result = await response.json()
      
      if (result.success) {
        // Handle both single server response and list response (fallback)
        let serverData = result.data
        
        // If we got a list response, find the matching server by slug
        if (result.data?.servers && Array.isArray(result.data.servers)) {
          serverData = result.data.servers.find((s: any) => s.slug === slug)
        }
        
        // Ensure repository object exists with defaults
        if (serverData && !serverData.repository) {
          serverData.repository = { stars: 0, url: '', owner: '', name: '' }
        } else if (serverData?.repository && serverData.repository.stars === undefined) {
          serverData.repository.stars = serverData.stats?.stars || 0
        }
        
        setServer(serverData)
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
          <p className="mt-4 text-foreground-secondary">Loading server details...</p>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            <GradientText>Server Not Found</GradientText>
          </h1>
          <p className="text-foreground-secondary mb-4">The requested MCP server could not be found.</p>
          <GradientButton asChild>
            <Link href="/discover">Browse All Servers</Link>
          </GradientButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="minimal" />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6 hover:text-primary">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discovery
          </Link>
        </Button>

        {/* Checkout Status Banner */}
        {checkoutStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-semibold text-green-400">Upgrade successful!</p>
              <p className="text-sm text-foreground-secondary">Your server listing has been upgraded. Changes will appear shortly.</p>
            </div>
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
            <XCircle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-400">Checkout cancelled</p>
              <p className="text-sm text-foreground-secondary">No charges were made. You can upgrade anytime from this page.</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    <GradientText>{server.name}</GradientText>
                  </h1>
                  <p className="text-xl text-foreground-secondary">{server.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {server.tier === 'FEATURED_SERVER' && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {server.tier === 'PRO_SERVER' && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <Zap className="h-3 w-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                  {server.verified && (
                    <Badge className="bg-success text-white border-none">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <CategoryBadge category={server.category as MCPCategory} />
                <div className="flex items-center gap-1 text-sm text-foreground-secondary">
                  <Star className="h-4 w-4 text-warning" />
                  {server.repository?.stars ?? (server.stats as any)?.stars ?? 0} stars
                </div>
                <div className="flex items-center gap-1 text-sm text-foreground-secondary">
                  <Download className="h-4 w-4 text-primary" />
                  {server.packages.npm?.downloadsTotal || 0} downloads
                </div>
              </div>

              {server.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {server.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-primary/20 text-foreground-secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Installation Instructions */}
            <GlassCard elevated>
              <div className="mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                  <Terminal className="h-5 w-5 text-primary" />
                  Quick Install
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-foreground">Using OpenConductor CLI</h4>
                  <div className="bg-background-elevated border border-primary/20 rounded-md p-4 font-mono text-sm relative">
                    <code className="text-foreground">openconductor install {server.slug}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0 hover:text-primary"
                      onClick={() => copyToClipboard(`openconductor install ${server.slug}`, 'cli')}
                    >
                      {copied === 'cli' ? (
                        <CheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {server.installation?.npm && (
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Manual Installation</h4>
                    <div className="bg-background-elevated border border-primary/20 rounded-md p-4 font-mono text-sm relative">
                      <code className="text-foreground">{server.installation.npm}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0 hover:text-primary"
                        onClick={() => copyToClipboard(server.installation?.npm || '', 'npm')}
                      >
                        {copied === 'npm' ? (
                          <CheckCircle className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {server.installation?.docker && (
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Docker</h4>
                    <div className="bg-background-elevated border border-primary/20 rounded-md p-4 font-mono text-sm relative">
                      <code className="text-foreground">{server.installation.docker}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0 hover:text-primary"
                        onClick={() => copyToClipboard(server.installation?.docker || '', 'docker')}
                      >
                        {copied === 'docker' ? (
                          <CheckCircle className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Configuration Example */}
            <GlassCard elevated>
              <div className="mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                  <Book className="h-5 w-5 text-primary" />
                  Claude Desktop Configuration
                </h3>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary mb-4">
                  Add this configuration to your Claude Desktop config file:
                </p>
                <div className="bg-background-elevated border border-primary/20 rounded-md p-4 relative">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-foreground">{JSON.stringify({
                      mcpServers: {
                        [server.name.toLowerCase()]: server.configuration.example
                      }
                    }, null, 2)}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-8 w-8 p-0 hover:text-primary"
                    onClick={() => copyToClipboard(JSON.stringify({
                      mcpServers: {
                        [server.name.toLowerCase()]: server.configuration.example
                      }
                    }, null, 2), 'config')}
                  >
                    {copied === 'config' ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upgrade CTA - Maintainer Monetization */}
            <UpgradeCard 
              serverId={server.id} 
              serverSlug={server.slug}
              currentTier={server.tier}
            />

            {/* Quick Actions */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h3>
              <div className="space-y-3">
                {server.repository?.url && (
                  <GradientButton className="w-full" asChild>
                    <a href={server.repository.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Repository
                    </a>
                  </GradientButton>
                )}

                {server.packages.npm && (
                  <Button variant="outline" className="w-full border-primary/20 hover:border-primary/40" asChild>
                    <a
                      href={`https://www.npmjs.com/package/${server.packages.npm.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      NPM Package
                    </a>
                  </Button>
                )}
              </div>
            </GlassCard>

            {/* Stats */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-secondary">GitHub Stars</span>
                  <span className="font-medium text-foreground">{server.repository?.stars ?? (server.stats as any)?.stars ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-secondary">NPM Downloads</span>
                  <span className="font-medium text-foreground">{server.packages.npm?.downloadsTotal || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-secondary">Last Updated</span>
                  <span className="font-medium text-foreground">
                    {server.repository?.lastCommit || (server.stats as any)?.lastCommit 
                      ? new Date(server.repository?.lastCommit || (server.stats as any)?.lastCommit || '').toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground-secondary">Category</span>
                  <Badge variant="outline" className="border-primary/20">{server.category}</Badge>
                </div>
              </div>
            </GlassCard>

            {/* Related Servers */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Related Servers</h3>
              <div>
                <p className="text-sm text-foreground-secondary mb-3">
                  Discover more {server.category} servers
                </p>
                <Button variant="outline" size="sm" className="w-full border-primary/20 hover:border-primary/40" asChild>
                  <Link href={`/discover?category=${server.category}`}>
                    Browse {server.category} servers
                  </Link>
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}