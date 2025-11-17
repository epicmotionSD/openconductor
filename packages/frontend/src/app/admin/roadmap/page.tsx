'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Target, TrendingUp, CheckCircle2, Clock,
  Pause, Plus, Edit, Sparkles, Filter, Users
} from 'lucide-react'

interface RoadmapItem {
  id: string
  title: string
  slug: string
  description: string
  categoryId: string
  categoryName: string
  categorySlug: string
  categoryColor: string
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  targetQuarter: string
  targetDate: string
  completedDate: string
  progressPercentage: number
  owner: string
  tags: string[]
  metadata: any
  voteCount: number
  isPublic: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

interface RoadmapCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string
  displayOrder: number
  isActive: boolean
  createdAt: string
}

interface RoadmapStats {
  totalItems: number
  plannedCount: number
  inProgressCount: number
  completedCount: number
  onHoldCount: number
  featuredCount: number
  avgProgress: number
  totalVotes: number
}

interface RoadmapUpdate {
  id: string
  roadmapItemId: string
  title: string
  content: string
  updateType: string
  previousStatus: string
  newStatus: string
  progressChange: number
  createdBy: string
  createdAt: string
  itemTitle: string
  itemSlug: string
}

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [categories, setCategories] = useState<RoadmapCategory[]>([])
  const [stats, setStats] = useState<RoadmapStats>({
    totalItems: 0,
    plannedCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    onHoldCount: 0,
    featuredCount: 0,
    avgProgress: 0,
    totalVotes: 0
  })
  const [recentUpdates, setRecentUpdates] = useState<RoadmapUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchRoadmapData()
  }, [])

  const fetchRoadmapData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/roadmap')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch roadmap data')
      }

      setItems(result.data.items)
      setCategories(result.data.categories)
      setStats(result.data.stats)
      setRecentUpdates(result.data.recentUpdates)
    } catch (err: any) {
      console.error('Failed to fetch roadmap:', err)
      setError(err.message || 'Failed to load roadmap data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'planned': return <Target className="h-4 w-4" />
      case 'in-progress': return <TrendingUp className="h-4 w-4" />
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'on-hold': return <Pause className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: RoadmapItem['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const filteredItems = items.filter(item => {
    const matchesStatus = activeFilter === 'all' || item.status === activeFilter
    const matchesCategory = activeCategoryFilter === 'all' || item.categorySlug === activeCategoryFilter
    return matchesStatus && matchesCategory
  })

  const featuredItems = items.filter(item => item.isFeatured)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roadmap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchRoadmapData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Roadmap</h1>
          <p className="text-gray-600">Track features, improvements, and future development</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Roadmap Item
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressCount}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avgProgress}%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalVotes}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Featured Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {featuredItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge className={getStatusColor(item.status)} style={{ fontSize: '0.7rem' }}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.targetQuarter}</span>
                    <span>{item.progressPercentage}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${item.progressPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Status:</span>
          <div className="flex gap-2">
            {['all', 'planned', 'in-progress', 'completed', 'on-hold'].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={activeFilter === status ? 'default' : 'outline'}
                onClick={() => setActiveFilter(status)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Button
          size="sm"
          variant={activeCategoryFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveCategoryFilter('all')}
        >
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            size="sm"
            variant={activeCategoryFilter === category.slug ? 'default' : 'outline'}
            onClick={() => setActiveCategoryFilter(category.slug)}
            style={{
              backgroundColor: activeCategoryFilter === category.slug ? category.color : undefined,
              borderColor: category.color,
              color: activeCategoryFilter === category.slug ? '#fff' : category.color
            }}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Roadmap Items */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Roadmap Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(item.status)}
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(item.priority)}
                      >
                        {item.priority}
                      </Badge>
                      {item.categoryName && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: item.categoryColor, color: item.categoryColor }}
                        >
                          {item.categoryName}
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3">{item.description}</p>

                    <div className="flex gap-6 text-sm text-gray-500 mb-3">
                      {item.owner && <span>Owner: {item.owner}</span>}
                      {item.targetQuarter && <span>Target: {item.targetQuarter}</span>}
                      {item.voteCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.voteCount} votes
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{item.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUpdates.map((update) => (
                <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{update.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{update.content}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Item: {update.itemTitle}</span>
                        <span>By: {update.createdBy}</span>
                        <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {update.progressChange && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        +{update.progressChange}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
