'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  History, CheckCircle, AlertTriangle, Clock,
  Brain, Wrench, TrendingUp, Calculator,
  ChevronRight, RotateCcw, Loader2, XCircle
} from 'lucide-react'
import {
  getRecentDecisions,
  approveDecision,
  rejectDecision,
  type Decision
} from '@/lib/command-center-api'

type AgentRole = 'ceo' | 'cto' | 'cmo' | 'cfo'

const roleIcons = {
  ceo: Brain,
  cto: Wrench,
  cmo: TrendingUp,
  cfo: Calculator
}

const roleColors = {
  ceo: 'text-purple-500',
  cto: 'text-blue-500',
  cmo: 'text-green-500',
  cfo: 'text-amber-500'
}

const impactColors = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-red-500/10 text-red-500'
}

const decisionTypeLabels: Record<string, string> = {
  deploy_template: 'Deploy',
  pause_keyword: 'Pause',
  adjust_budget: 'Budget',
  create_campaign: 'Campaign',
  flag_ad_bleed: 'Alert',
  recommend_action: 'Recommend',
  escalate_to_human: 'Escalate'
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function DecisionLog() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDecisions = useCallback(async () => {
    try {
      setError(null)
      const data = await getRecentDecisions(20)
      setDecisions(data)
    } catch (err: any) {
      console.error('Failed to fetch decisions:', err)
      setError(err.message || 'Failed to load decisions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDecisions()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDecisions, 10000)
    return () => clearInterval(interval)
  }, [fetchDecisions])

  const handleApprove = async (decisionId: string) => {
    setActionLoading(decisionId)
    try {
      await approveDecision(decisionId)
      await fetchDecisions()
    } catch (err: any) {
      console.error('Failed to approve decision:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (decisionId: string) => {
    setActionLoading(decisionId)
    try {
      await rejectDecision(decisionId, 'Rejected by human operator')
      await fetchDecisions()
    } catch (err: any) {
      console.error('Failed to reject decision:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredDecisions = decisions.filter(d => {
    if (filter === 'pending') return !d.approved
    if (filter === 'executed') return d.approved && d.executedAt
    return true
  })

  const pendingCount = decisions.filter(d => !d.approved).length

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Decision Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading decisions...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Decision Log
          </CardTitle>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {(['all', 'pending', 'executed'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-4 text-red-400">
            <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No decisions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredDecisions.map((decision) => {
              const RoleIcon = roleIcons[decision.agentRole as AgentRole] || Brain
              const roleColor = roleColors[decision.agentRole as AgentRole] || 'text-gray-500'
              const impact = (decision.impact || 'medium') as keyof typeof impactColors

              return (
                <div
                  key={decision.id}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${!decision.approved ? 'border-warning/30 bg-warning/5' : 'border-border'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RoleIcon className={`h-4 w-4 ${roleColor}`} />
                      <span className="text-sm font-medium text-foreground capitalize">
                        {decision.agentRole}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {decisionTypeLabels[decision.decisionType] || decision.decisionType}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${impactColors[impact]}`}>
                      {impact}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-foreground mb-1">{decision.title}</p>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {decision.description || decision.reasoning}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(decision.createdAt)}
                      </span>
                      <span>|</span>
                      <span>{Math.round(decision.confidence * 100)}% confidence</span>
                    </div>

                    {decision.approved ? (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        <span>
                          {decision.approvedBy === 'human' ? 'Human approved' : 'Auto-approved'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => handleApprove(decision.id)}
                          disabled={actionLoading === decision.id}
                        >
                          {actionLoading === decision.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Approve'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => handleReject(decision.id)}
                          disabled={actionLoading === decision.id}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full mt-3"
          size="sm"
          onClick={fetchDecisions}
        >
          <History className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  )
}
