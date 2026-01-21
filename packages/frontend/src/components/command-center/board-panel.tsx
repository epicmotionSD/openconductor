'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AgentCard } from './agent-card'
import { Users, Activity, CheckCircle, Clock } from 'lucide-react'

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

interface BoardPanelProps {
  members: BoardMember[]
  onRefresh?: () => void
}

export function BoardPanel({ members, onRefresh }: BoardPanelProps) {
  const activeCount = members.filter(m => m.status === 'active').length
  const totalDecisions = members.reduce((sum, m) => sum + m.metrics.decisionsToday, 0)
  const avgSuccessRate = members.length > 0
    ? members.reduce((sum, m) => sum + m.metrics.successRate, 0) / members.length
    : 0

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Board of Directors
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-success">{activeCount}</span> active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-info" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-info">{totalDecisions}</span> tasks completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                <span className="font-semibold">{avgSuccessRate.toFixed(1)}%</span> success rate
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No agents loaded. Start the orchestrator to initialize agents.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {members.map((member) => (
              <AgentCard key={member.id} agent={member} onAction={onRefresh} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
