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
    id: number;
    name: string;
    slug: string;
    category: string;
    installs: number;
    stars: number;
  }[];
  categories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  github: {
    totalEvents: number;
    processedEvents: number;
    recentEvents: number;
  };
  performance: {
    avgResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    uptime: number;
  };
  activity: {
    type: string;
    serverName: string;
    slug: string;
    timestamp: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/analytics')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }

      setData(result.data)
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err)
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
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
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-2">Error loading analytics</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchAnalytics}>Retry</Button>
            </div>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-600">No analytics data available</p>
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
                    <div key={server.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{server.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {server.category || 'uncategorized'}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">{server.installs.toLocaleString()} installs</div>
                        <div className="text-sm text-gray-600">{server.stars} ⭐</div>
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
                      <div key={cat.category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">{cat.category || 'uncategorized'}</span>
                          <div className="text-right">
                            <span className="font-semibold">{cat.count}</span>
                            <span className="text-sm text-gray-500 ml-2">{cat.percentage}%</span>
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
                      <div className="text-2xl font-bold text-blue-600">{data.github.totalEvents.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Events</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data.github.processedEvents.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Processed Events</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {data.github.totalEvents > 0
                          ? ((data.github.processedEvents / data.github.totalEvents) * 100).toFixed(1)
                          : '0'}%
                      </div>
                      <div className="text-sm text-gray-600">Processing Rate</div>
                    </div>

                    <div className="text-center p-4 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">{data.github.recentEvents}</div>
                      <div className="text-sm text-gray-600">Last 24h Events</div>
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

            {/* Recent Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.activity.length > 0 ? (
                    data.activity.map((event, index) => (
                      <div key={`${event.slug}-${index}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="font-medium">New server added: {event.serverName}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(event.timestamp).toLocaleString()} • {event.slug}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{event.type}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent activity</p>
                  )}
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
                  <Badge variant="secondary">{data.overview.totalServers} servers</Badge>
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
  )
}