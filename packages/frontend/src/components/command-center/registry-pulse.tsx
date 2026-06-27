'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Target, TrendingUp, Zap, ChevronRight,
  Search, Globe, Clock, Rocket
} from 'lucide-react'

interface ServerSignal {
  id: string
  serverName: string
  category: 'rising' | 'breakout' | 'declining' | 'stable'
  growthRate: number
  installs: number
  competitionLevel: 'low' | 'medium' | 'high'
  recommendedAction: 'feature' | 'promote' | 'monitor' | 'ignore'
  source: string
  timeframe: string
  detectedAt: string
}

// Mock signals — trending MCP servers across the ecosystem
const mockSignals: ServerSignal[] = [
  {
    id: '1',
    serverName: 'playwright-mcp',
    category: 'breakout',
    growthRate: 450,
    installs: 2400,
    competitionLevel: 'low',
    recommendedAction: 'feature',
    source: 'npm + Cursor',
    timeframe: '7d',
    detectedAt: '2 hours ago'
  },
  {
    id: '2',
    serverName: 'memory-bank-mcp',
    category: 'rising',
    growthRate: 180,
    installs: 5200,
    competitionLevel: 'medium',
    recommendedAction: 'feature',
    source: 'Claude Desktop',
    timeframe: '7d',
    detectedAt: '4 hours ago'
  },
  {
    id: '3',
    serverName: 'cloudflare-mcp',
    category: 'rising',
    growthRate: 120,
    installs: 1800,
    competitionLevel: 'low',
    recommendedAction: 'promote',
    source: 'GitHub stars',
    timeframe: '7d',
    detectedAt: '6 hours ago'
  },
  {
    id: '4',
    serverName: 'slack-mcp',
    category: 'stable',
    growthRate: 15,
    installs: 3600,
    competitionLevel: 'high',
    recommendedAction: 'monitor',
    source: 'npm registry',
    timeframe: '7d',
    detectedAt: '1 day ago'
  }
]

const categoryConfig = {
  breakout: {
    label: 'Breakout',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: Zap
  },
  rising: {
    label: 'Rising',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: TrendingUp
  },
  declining: {
    label: 'Declining',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: TrendingUp
  },
  stable: {
    label: 'Stable',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: Search
  }
}

const actionConfig = {
  feature: { label: 'Feature', color: 'bg-green-500 hover:bg-green-600' },
  promote: { label: 'Promote', color: 'bg-blue-500 hover:bg-blue-600' },
  monitor: { label: 'Monitor', color: 'bg-gray-500 hover:bg-gray-600' },
  ignore: { label: 'Ignore', color: 'bg-gray-400 hover:bg-gray-500' }
}

const competitionColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500'
}

export function RegistryPulse() {
  const [signals] = useState<ServerSignal[]>(mockSignals)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const breakoutCount = signals.filter(s => s.category === 'breakout').length
  const risingCount = signals.filter(s => s.category === 'rising').length

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Registry Pulse
            <Badge variant="secondary" className="ml-2">
              Live
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-purple-500">{breakoutCount}</span>
              <span className="text-muted-foreground">breakout</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-green-500">{risingCount}</span>
              <span className="text-muted-foreground">rising</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Trending MCP servers across npm, GitHub, and connected clients
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.map((signal) => {
            const category = categoryConfig[signal.category]
            const action = actionConfig[signal.recommendedAction]
            const CategoryIcon = category.icon
            const isExpanded = expandedId === signal.id

            return (
              <div
                key={signal.id}
                className={`
                  p-4 rounded-lg border transition-all cursor-pointer
                  ${signal.category === 'breakout' ? 'border-purple-500/30 bg-purple-500/5' : 'border-border'}
                  hover:border-primary/30
                `}
                onClick={() => setExpandedId(isExpanded ? null : signal.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={category.color}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {category.label}
                    </Badge>
                    <span className="font-medium text-foreground">{signal.serverName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      signal.growthRate > 200 ? 'text-purple-500' :
                      signal.growthRate > 100 ? 'text-green-500' :
                      'text-foreground'
                    }`}>
                      +{signal.growthRate}%
                    </span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Installs (7d)</p>
                        <p className="font-semibold">{signal.installs.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Competition</p>
                        <p className={`font-semibold ${competitionColors[signal.competitionLevel]}`}>
                          {signal.competitionLevel.charAt(0).toUpperCase() + signal.competitionLevel.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {signal.source}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Detected</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {signal.detectedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={`flex-1 ${action.color}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Promote to Discover page
                        }}
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Feature on Discover
                      </Button>
                      <Button variant="outline" size="sm">
                        View Server
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
