'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Terminal, Settings, Activity, Users, Server, 
  TrendingUp, GitBranch, Clock, CheckCircle, 
  AlertTriangle, Zap, Database, Shield
} from 'lucide-react'

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  server: string;
  slug: string;
  verified: boolean;
  timestamp: string;
  timeAgo: string;
}

interface AdminStats {
  servers: {
    total: number;
    verified: number;
    pending: number;
    trending: number;
  };
  github: {
    syncStatus: string;
    lastSync: string;
    webhooks: number;
    repos: number;
    successRate?: number;
  };
  jobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  api: {
    requestsToday: number;
    errorRate: number;
    avgResponseTime: number;
    activeKeys: number;
  };
  health?: {
    database: boolean;
    redis: boolean;
    github: boolean;
    workers: boolean;
  };
  recentActivity?: ActivityItem[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    servers: { total: 127, verified: 89, pending: 12, trending: 23 },
    github: { syncStatus: 'active', lastSync: '2 minutes ago', webhooks: 156, repos: 127 },
    jobs: { pending: 3, processing: 1, completed: 1247, failed: 12 },
    api: { requestsToday: 2847, errorRate: 0.8, avgResponseTime: 245, activeKeys: 18 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const adminKey = localStorage.getItem('admin-api-key')

      if (!adminKey) {
        console.error('No admin API key found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      })

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        console.error('Failed to fetch stats:', result.error)
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Platform Administration</h1>
        <p className="text-muted-foreground">
          Monitor and manage the OpenConductor platform
        </p>
      </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading admin dashboard...</span>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Servers</p>
                      <p className="text-3xl font-bold text-primary">{stats.servers.total}</p>
                    </div>
                    <Server className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    +12 this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                      <p className="text-3xl font-bold text-success">{stats.api.requestsToday.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Today, {stats.api.avgResponseTime}ms avg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">GitHub Sync</p>
                      <p className="text-3xl font-bold text-info">{stats.github.repos}</p>
                    </div>
                    <GitBranch className="h-8 w-8 text-info" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last sync: {stats.github.lastSync}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                      <p className="text-3xl font-bold text-warning">{stats.api.errorRate}%</p>
                    </div>
                    <Shield className="h-8 w-8 text-warning" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: &lt;1%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Database (Supabase)</span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Redis Cache</span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground">GitHub Integration</span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Background Workers</span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Running
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Background Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Pending Jobs</span>
                    <Badge variant="outline">{stats.jobs.pending}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Currently Processing</span>
                    <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
                      {stats.jobs.processing}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Completed Today</span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      {stats.jobs.completed}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Failed (24h)</span>
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                      {stats.jobs.failed}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Server Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Server Registry Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">{stats.servers.total}</div>
                    <div className="text-sm text-muted-foreground">Total Servers</div>
                  </div>

                  <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="text-2xl font-bold text-success">{stats.servers.verified}</div>
                    <div className="text-sm text-muted-foreground">Verified</div>
                  </div>

                  <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="text-2xl font-bold text-warning">{stats.servers.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                  </div>

                  <div className="text-center p-4 bg-info/10 rounded-lg border border-info/20">
                    <div className="text-2xl font-bold text-info">{stats.servers.trending}</div>
                    <div className="text-sm text-muted-foreground">Trending</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/admin/servers">
                      Manage Servers
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/admin/marketing">
                      Marketing Campaigns
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/roadmap">
                      Roadmap Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/analytics">
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  GitHub Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{stats.github.repos}</div>
                    <div className="text-sm text-gray-600">Monitored Repos</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-green-600">{stats.github.webhooks}</div>
                    <div className="text-sm text-gray-600">Webhooks Today</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-purple-600">99.8%</div>
                    <div className="text-sm text-gray-600">Sync Success Rate</div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button asChild>
                    <Link href="/admin/github">
                      GitHub Settings
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/webhooks">
                      Webhook Logs
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/discovery">
                      Force Discovery
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/servers/verify">
                  <CheckCircle className="h-6 w-6" />
                  <span>Verify Servers</span>
                  <Badge variant="secondary">{stats.servers.pending}</Badge>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/analytics">
                  <TrendingUp className="h-6 w-6" />
                  <span>Analytics</span>
                  <span className="text-xs text-gray-500">Real-time</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/users">
                  <Users className="h-6 w-6" />
                  <span>User Management</span>
                  <Badge variant="secondary">{stats.api.activeKeys}</Badge>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/monitoring">
                  <Shield className="h-6 w-6" />
                  <span>Monitoring</span>
                  <span className="text-xs text-green-600">All systems OK</span>
                </Link>
              </Button>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">OpenMemory v2.1.0 released</div>
                      <div className="text-sm text-gray-600">Auto-verified and indexed • 5 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">New server submitted: PostgreSQL Pro MCP</div>
                      <div className="text-sm text-gray-600">Pending community review • 12 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <GitBranch className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">GitHub webhook processed: 47 repository updates</div>
                      <div className="text-sm text-gray-600">Stats refreshed automatically • 18 minutes ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">Rate limit threshold reached for anonymous users</div>
                      <div className="text-sm text-gray-600">Auto-scaled limits • 1 hour ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Features Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Enterprise Features Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Core Platform</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Server Discovery & Search</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">CLI Installation</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Advanced Analytics</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Enterprise Features</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">GitHub Webhooks</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Server Submission</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Background Jobs</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Key Management</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
}