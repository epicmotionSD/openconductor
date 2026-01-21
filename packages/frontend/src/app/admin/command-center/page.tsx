'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, TrendingUp, AlertTriangle, Rocket,
  DollarSign, Target, Zap, Activity,
  Brain, RefreshCw, Power, PowerOff,
  CheckCircle, XCircle, Loader2
} from 'lucide-react'
import { BoardPanel } from '@/components/command-center/board-panel'
import { RevenueSniperWidget } from '@/components/command-center/revenue-sniper'
import { AdBleedAlerts } from '@/components/command-center/ad-bleed-alert'
import { TemplateSelector } from '@/components/command-center/template-selector'
import { DecisionLog } from '@/components/command-center/decision-log'
import {
  getCommandCenterSummary,
  startOrchestrator,
  stopOrchestrator,
  type CommandCenterSummary,
  type Agent
} from '@/lib/command-center-api'

// Map API agent data to BoardMember format
interface BoardMember {
  id: string
  name: string
  role: 'ceo' | 'cto' | 'cmo' | 'cfo'
  title: string
  status: 'idle' | 'active' | 'paused' | 'error' | 'offline'
  avatar: string
  currentTask?: string
  metrics: {
    decisionsToday: number
    successRate: number
    avgResponseTime: number
  }
}

const roleTitles: Record<string, string> = {
  ceo: 'Chief Executive Officer',
  cto: 'Chief Technology Officer',
  cmo: 'Chief Marketing Officer',
  cfo: 'Chief Financial Officer'
}

const roleAvatars: Record<string, string> = {
  ceo: '🎯',
  cto: '🔧',
  cmo: '📈',
  cfo: '💰'
}

function mapAgentToBoardMember(agent: Agent): BoardMember {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    title: roleTitles[agent.role] || agent.description,
    status: agent.status,
    avatar: roleAvatars[agent.role] || agent.avatar,
    currentTask: agent.status === 'active' ? 'Processing tasks...' : undefined,
    metrics: {
      decisionsToday: agent.metrics.tasksCompleted,
      successRate: agent.metrics.successRate || 100,
      avgResponseTime: agent.metrics.avgResponseTime || 0
    }
  }
}

export default function CommandCenterPage() {
  const [summary, setSummary] = useState<CommandCenterSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [orchestratorAction, setOrchestratorAction] = useState<'starting' | 'stopping' | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const data = await getCommandCenterSummary()
      setSummary(data)
      setLastUpdated(new Date())
    } catch (err: any) {
      console.error('Failed to fetch command center data:', err)
      setError(err.message || 'Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStartOrchestrator = async () => {
    setOrchestratorAction('starting')
    try {
      await startOrchestrator()
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setOrchestratorAction(null)
    }
  }

  const handleStopOrchestrator = async () => {
    setOrchestratorAction('stopping')
    try {
      await stopOrchestrator()
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setOrchestratorAction(null)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const isRunning = summary?.orchestrator?.isRunning ?? false
  const agents = summary?.orchestrator?.agents || []
  const boardMembers = agents.map(mapAgentToBoardMember)
  const stats = summary?.orchestrator?.summary

  // Calculate stats
  const totalTasksCompleted = stats?.totalTasksCompleted || 0
  const pendingTasks = stats?.totalTasksPending || 0
  const activeAgents = stats?.activeAgents || 0
  const pendingDecisions = summary?.pendingApprovals?.length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Revenue Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Board of Directors - Autonomous Revenue Operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Orchestrator Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isRunning ? 'Orchestrator Online' : 'Orchestrator Offline'}
            </span>
          </div>

          {/* Start/Stop Orchestrator */}
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStopOrchestrator}
              disabled={orchestratorAction !== null}
            >
              {orchestratorAction === 'stopping' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4 mr-2" />
              )}
              Stop All
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleStartOrchestrator}
              disabled={orchestratorAction !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {orchestratorAction === 'starting' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              Start All
            </Button>
          )}

          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-500">Connection Error</p>
            <p className="text-xs text-red-400">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold text-success">
                  {totalTasksCompleted}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <Activity className="h-3 w-3 text-success mr-1" />
              <span className="text-success">{pendingTasks} pending</span>
              <span className="text-muted-foreground ml-1">in queue</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold text-primary">
                  {activeAgents}/{agents.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <Zap className="h-3 w-3 text-primary mr-1" />
              <span className="text-primary">{stats?.idleAgents || 0} idle</span>
              <span className="text-muted-foreground ml-1">
                {stats?.errorAgents || 0} errors
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Decisions</p>
                <p className="text-2xl font-bold text-warning">
                  {pendingDecisions}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/50" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-warning">Awaiting approval</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-info">
                  {isRunning && summary?.orchestrator?.startedAt
                    ? formatUptime(summary.orchestrator.startedAt)
                    : '--:--'}
                </p>
              </div>
              <Rocket className="h-8 w-8 text-info/50" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-info">
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Board of Directors Panel */}
      <BoardPanel members={boardMembers} onRefresh={fetchData} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Sniper - Trend Detection */}
          <RevenueSniperWidget />

          {/* Ad Bleed Alerts */}
          <AdBleedAlerts />
        </div>

        {/* Right Column - Actions & Log */}
        <div className="space-y-6">
          {/* Template Selector */}
          <TemplateSelector />

          {/* Decision Log - Connected to API */}
          <DecisionLog />
        </div>
      </div>
    </div>
  )
}

function formatUptime(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m ${seconds}s`
}
