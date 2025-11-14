'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Terminal, Plus, Edit, Trash2, CheckCircle, X,
  ExternalLink, Star, Download, Search
} from 'lucide-react'
import type { MCPServer } from '../../../types'

interface ServerFormData {
  name: string
  slug: string
  tagline: string
  description: string
  repository_url: string
  repository_owner: string
  repository_name: string
  npm_package: string
  category: string
  tags: string[]
  install_command: string
  verified: boolean
  featured: boolean
}

export default function ServerManagementPage() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    repository_url: '',
    repository_owner: '',
    repository_name: '',
    npm_package: '',
    category: 'custom',
    tags: [],
    install_command: '',
    verified: false,
    featured: false
  })

  const categories = ['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    setLoading(true)
    try {
      // Fix API URL and add admin authentication
      const apiUrl = 'http://127.0.0.1:3002'
      const adminKey = typeof window !== 'undefined' ? localStorage.getItem('admin-api-key') : ''
      
      const response = await fetch(`${apiUrl}/v1/admin/servers?limit=100`, {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      })
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

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const generateInstallCommand = (slug: string) => {
    return `openconductor install ${slug}`
  }

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name)
    setFormData(prev => ({
      ...prev,
      name,
      slug,
      install_command: generateInstallCommand(slug)
    }))
  }

  const handleRepositoryUrlChange = (url: string) => {
    // Extract owner and repo from GitHub URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (match) {
      setFormData(prev => ({
        ...prev,
        repository_url: url,
        repository_owner: match[1],
        repository_name: match[2]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        repository_url: url
      }))
    }
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Fix API URL - use direct IP to avoid localhost resolution issues
      const apiUrl = 'http://127.0.0.1:3002'
      const url = editingServer
        ? `${apiUrl}/v1/admin/servers/${editingServer.id}`
        : `${apiUrl}/v1/admin/servers`
      
      const method = editingServer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-api-key')}` // Will be set by user
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchServers()
        setShowAddForm(false)
        setEditingServer(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving server:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      description: '',
      repository_url: '',
      repository_owner: '',
      repository_name: '',
      npm_package: '',
      category: 'custom',
      tags: [],
      install_command: '',
      verified: false,
      featured: false
    })
  }

  const handleEdit = (server: MCPServer) => {
    setEditingServer(server)
    setFormData({
      name: server.name,
      slug: server.slug,
      tagline: server.tagline || '',
      description: server.description || '',
      repository_url: server.repository.url,
      repository_owner: server.repository.owner,
      repository_name: server.repository.name,
      npm_package: server.packages.npm?.name || '',
      category: server.category,
      tags: server.tags,
      install_command: server.installation.cli,
      verified: server.verified,
      featured: server.featured
    })
    setShowAddForm(true)
  }

  const handleDelete = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return
    
    try {
      // Fix API URL - use direct IP to avoid localhost resolution issues
      const apiUrl = 'http://127.0.0.1:3002'
      const response = await fetch(`${apiUrl}/v1/admin/servers/${serverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin-api-key') : ''}`
        }
      })

      if (response.ok) {
        await fetchServers()
      }
    } catch (error) {
      console.error('Error deleting server:', error)
    }
  }

  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Server Management</h1>
          <p className="text-gray-600">Manually add and manage MCP servers for CLI installation</p>
        </div>
        
        <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add New Server
        </Button>
      </div>

      {/* API Key Setup Notice */}
      {typeof window !== 'undefined' && !localStorage.getItem('admin-api-key') && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-orange-600">⚠️</div>
              <div>
                <div className="font-medium text-orange-800">Admin API Key Required</div>
                <div className="text-sm text-orange-700">
                  Set your admin API key: <code className="bg-orange-100 px-2 py-1 rounded">localStorage.setItem('admin-api-key', 'oc_admin_...')</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingServer ? 'Edit Server' : 'Add New MCP Server'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Server Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="OpenMemory"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Slug (auto-generated)</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="openmemory"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tagline</label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Hierarchical memory for AI agents"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what this MCP server does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">GitHub Repository URL *</label>
                <Input
                  value={formData.repository_url}
                  onChange={(e) => handleRepositoryUrlChange(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  required
                />
                {formData.repository_owner && (
                  <p className="text-sm text-gray-600 mt-1">
                    Owner: {formData.repository_owner} | Repo: {formData.repository_name}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">NPM Package</label>
                  <Input
                    value={formData.npm_package}
                    onChange={(e) => setFormData(prev => ({ ...prev, npm_package: e.target.value }))}
                    placeholder="@username/package-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="memory, semantic, AI, search"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CLI Install Command (auto-generated)</label>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                  {formData.install_command || 'openconductor install [server-slug]'}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                  />
                  Verified Server
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                  Featured Server
                </label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingServer ? 'Update Server' : 'Add Server'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingServer(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Server List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading servers...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredServers.map((server) => (
            <Card key={server.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{server.name}</h3>
                      {server.verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {server.featured && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          ⭐ Featured
                        </Badge>
                      )}
                      <Badge variant="outline">{server.category}</Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{server.tagline || server.description}</p>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Repository:</span>
                        <a 
                          href={server.repository.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          {server.repository.owner}/{server.repository.name}
                          <ExternalLink className="inline h-3 w-3 ml-1" />
                        </a>
                      </div>
                      
                      <div>
                        <span className="font-medium">CLI Install:</span>
                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                          {server.installation.cli}
                        </code>
                      </div>
                      
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {server.repository.stars || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {server.stats?.installs || 0}
                        </span>
                      </div>
                    </div>
                    
                    {server.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {server.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(server)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(server.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredServers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No servers found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Add your first MCP server to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Server
            </Button>
          )}
        </div>
      )}
    </div>
  )
}