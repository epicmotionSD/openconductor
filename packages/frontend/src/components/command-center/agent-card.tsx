'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play, Pause, Square, Settings, Loader2
} from 'lucide-react'
import {
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
} from '@/lib/command-center-api'
import { ROLE_CONFIG, type BoardMember } from '@/lib/board'

interface AgentCardProps {
  agent: BoardMember
  onAction?: () => void
}

const statusConfig = {
  idle: { label: 'Idle', variant: 'secondary' as const, dotColor: 'bg-gray-400' },
  active: { label: 'Active', variant: 'default' as const, dotColor: 'bg-green-500 animate-pulse' },
  paused: { label: 'Paused', variant: 'outline' as const, dotColor: 'bg-yellow-500' },
  error: { label: 'Error', variant: 'destructive' as const, dotColor: 'bg-red-500' },
  offline: { label: 'Offline', variant: 'secondary' as const, dotColor: 'bg-gray-300' }
}

export function AgentCard({ agent, onAction }: AgentCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const role = ROLE_CONFIG[agent.role]
  const status = statusConfig[agent.status]

  const handleAction = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    setLoading(action)
    try {
      switch (action) {
        case 'start':
          await startAgent(agent.role)
          break
        case 'stop':
          await stopAgent(agent.role)
          break
        case 'pause':
          await pauseAgent(agent.role)
          break
        case 'resume':
          await resumeAgent(agent.role)
          break
      }
      onAction?.()
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className={`relative overflow-hidden border ${role.borderColor}`}>
      {/* Status indicator strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        agent.status === 'active' ? 'bg-green-500' :
        agent.status === 'error' ? 'bg-red-500' :
        agent.status === 'paused' ? 'bg-yellow-500' :
        'bg-gray-300'
      }`} />

      <CardContent className="p-4 pt-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${role.bgColor} flex items-center justify-center text-xl`}>
              {agent.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Current Task */}
        {agent.currentTask ? (
          <div className="mb-3 p-2 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Current Task</p>
            <p className="text-sm text-foreground line-clamp-2">{agent.currentTask}</p>
          </div>
        ) : (
          <div className="mb-3 p-2 rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">Awaiting tasks</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{agent.metrics.decisionsToday}</p>
            <p className="text-xs text-muted-foreground">Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-success">{agent.metrics.successRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Success</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{agent.metrics.avgResponseTime.toFixed(1)}s</p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {agent.status === 'active' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleAction('pause')}
                disabled={loading !== null}
              >
                {loading === 'pause' ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Pause className="h-3 w-3 mr-1" />
                )}
                Pause
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction('stop')}
                disabled={loading !== null}
              >
                {loading === 'stop' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </Button>
            </>
          ) : agent.status === 'paused' ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleAction('resume')}
                disabled={loading !== null}
              >
                {loading === 'resume' ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Resume
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction('stop')}
                disabled={loading !== null}
              >
                {loading === 'stop' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleAction('start')}
              disabled={loading !== null}
            >
              {loading === 'start' ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Start
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
