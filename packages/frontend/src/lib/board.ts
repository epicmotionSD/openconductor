import { Brain, Wrench, TrendingUp, Calculator } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Agent } from './command-center-api'

export type RoleId = 'ceo' | 'cto' | 'cmo' | 'cfo'

export type AgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'offline'

export interface BoardMemberMetrics {
  decisionsToday: number
  successRate: number
  avgResponseTime: number
}

export interface BoardMember {
  id: string
  name: string
  role: RoleId
  title: string
  status: AgentStatus
  avatar: string
  currentTask?: string
  metrics: BoardMemberMetrics
}

interface RoleStyle {
  title: string
  avatar: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
}

export const ROLE_CONFIG: Record<RoleId, RoleStyle> = {
  ceo: {
    title: 'Chief Executive Officer',
    avatar: '🎯',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  cto: {
    title: 'Chief Technology Officer',
    avatar: '🔧',
    icon: Wrench,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  cmo: {
    title: 'Chief Marketing Officer',
    avatar: '📈',
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  cfo: {
    title: 'Chief Financial Officer',
    avatar: '💰',
    icon: Calculator,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
}

export function mapAgentToBoardMember(agent: Agent): BoardMember {
  const role = ROLE_CONFIG[agent.role]
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    title: role?.title ?? agent.description,
    status: agent.status,
    avatar: role?.avatar ?? agent.avatar,
    currentTask: agent.status === 'active' ? 'Processing tasks...' : undefined,
    metrics: {
      decisionsToday: agent.metrics.tasksCompleted,
      successRate: agent.metrics.successRate || 100,
      avgResponseTime: agent.metrics.avgResponseTime || 0,
    },
  }
}
