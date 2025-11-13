'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, TrendingUp, BarChart3, Users, Server,
  GitBranch, Zap, Clock, Target, Activity, Database
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalServers: number;
    totalInstalls: number;
    activeUsers: number;
    growthRate: number;
  };
  trending: {
    name: string;
    installs: number;
    growth: number;
    category: string;
  }[];
  categories: {
    name: string;
    count: number;
    percentage: number;
    growth: number;
  }[];
  github: {
    syncEvents: number;
    newRepos: number;
    webhookSuccess: number;
    discoveries: number;
  };
  performance: {
    avgResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    uptime: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    overview: { totalServers: 127, totalInstalls: 2847, activeUsers: 456, growthRate: 23.5 },
    trending: [
      { name: 'OpenMemory', installs: 847, growth: 156, category: 'memory' },
      { name: 'GitHub MCP', installs: 672, growth: 89, category: 'api' },
      { name: 'PostgreSQL MCP', installs: 456, growth: 67, category: 'database' },
      { name: 'Filesystem MCP', installs: 523, growth: 45, category: 'filesystem' },
      { name: 'Slack MCP', installs: 334, growth: 34, category: 'communication' }
    ],
    categories: [
      { name: 'Memory', count: 23, percentage: 18, growth: 12.3 },
      { name: 'API Integration', count: 45, percentage: 35, growth: 8.7 },
      { name: 'Database', count: 18, percentage: 14, growth: 15.2 },
      { name: 'Filesystem', count: 21, percentage: 17, growth: 6.8 },
      { name: 'Communication', count: 12, percentage: 9, growth: 18.9 },
      { name: 'Other', count: 8, percentage: 6, growth: 4.2 }
    ],
    github: { syncEvents: 1247, newRepos: 23, webhookSuccess: 99.2, discoveries: 15 },
    performance: { avgResponseTime: 245, cacheHitRate: 94.5, errorRate: 0.8, uptime: 99.97 }
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      // Mock data for demo - in production would fetch real analytics
      setTimeout(() => setLoading(false), 500)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Advanced Analytics</span>
            <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">Enterprise</Badge>
          </div>
          <nav className="flex space-x-6">
            <Link href="/admin" className="text-sm hover:text-blue-600">Admin Dashboard</Link>
            <Link href="/discover" className="text-sm hover:text-blue-600">Discover</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
        </Button>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-xl text-gray-600">
              Real-time insights into platform usage and growth
            </p>
          </div>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map(range => (
              <Button 
                key={range}
                size="sm"
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading analytics...</span>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Servers</p>
                      <p className="text-3xl font-bold text-blue-600">{data.overview.totalServers}</p>
                    </div>
                    <Database className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    +{Math.floor(data.overview.growthRate)}% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Installs</p>
                      <p className="text-3xl font-bold text-green-600">{data.overview.totalInstalls.toLocaleString()}</p>
                    </div>
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    +156 today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-3xl font-bold text-purple-600">{data.overview.activeUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    +12% this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                      <p className="text-3xl font-bold text-teal-600">{data.overview.growthRate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-teal-600" />
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Week over week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trending Servers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Servers ({timeRange})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.trending.map((server, index) => (
                    <div key={server.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{server.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {server.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">{server.installs} installs</div>
                        <div className="text-sm text-green-600">+{server.growth} this week</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution & GitHub Stats */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.categories.map(cat => (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{cat.name}</span>
                          <div className="text-right">
                            <span className="font-semibold">{cat.count}</span>
                            <span className="text-sm text-green-600 ml-2">+{cat.growth}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${cat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    GitHub Automation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{data.github.syncEvents}</div>
                      <div className="text-sm text-gray-600">Sync Events</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data.github.newRepos}</div>
                      <div className="text-sm text-gray-600">New Repos Found</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{data.github.webhookSuccess}%</div>
                      <div className="text-sm text-gray-600">Webhook Success</div>
                    </div>
                    
                    <div className="text-center p-4 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">{data.github.discoveries}</div>
                      <div className="text-sm text-gray-600">Auto-Discoveries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{data.performance.avgResponseTime}ms</div>
                    <div className="text-gray-600">Avg Response Time</div>
                    <div className="text-sm text-green-600">Target: &lt;500ms</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{data.performance.cacheHitRate}%</div>
                    <div className="text-gray-600">Cache Hit Rate</div>
                    <div className="text-sm text-green-600">Target: &gt;90%</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{data.performance.errorRate}%</div>
                    <div className="text-gray-600">Error Rate</div>
                    <div className="text-sm text-green-600">Target: &lt;1%</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600 mb-2">{data.performance.uptime}%</div>
                    <div className="text-gray-600">Uptime</div>
                    <div className="text-sm text-green-600">Target: &gt;99.9%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Real-time Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="font-medium">New server installed: OpenMemory</div>
                      <div className="text-sm text-gray-600">User from San Francisco • Just now</div>
                    </div>
                    <Badge variant="outline" className="text-xs">memory</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">GitHub webhook: PostgreSQL MCP v2.1.0 released</div>
                      <div className="text-sm text-gray-600">Auto-indexed and updated • 2 min ago</div>
                    </div>
                    <Badge variant="outline" className="text-xs">database</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Server submitted: Advanced File Manager MCP</div>
                      <div className="text-sm text-gray-600">Pending community review • 5 min ago</div>
                    </div>
                    <Badge variant="outline" className="text-xs">filesystem</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">Trending spike detected: Slack MCP +34% installs</div>
                      <div className="text-sm text-gray-600">Algorithm triggered alert • 8 min ago</div>
                    </div>
                    <Badge variant="outline" className="text-xs">trending</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">GitHub auto-discovery: 3 new MCP repositories found</div>
                      <div className="text-sm text-gray-600">Queued for review and indexing • 12 min ago</div>
                    </div>
                    <Badge variant="outline" className="text-xs">discovery</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Controls */}
            <div className="grid md:grid-cols-3 gap-6">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/github">
                  <GitBranch className="h-6 w-6" />
                  <span>GitHub Automation</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/servers">
                  <Server className="h-6 w-6" />
                  <span>Server Management</span>
                  <Badge variant="secondary">127 servers</Badge>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/api-keys">
                  <Target className="h-6 w-6" />
                  <span>API Keys</span>
                  <Badge variant="secondary">3 active</Badge>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}