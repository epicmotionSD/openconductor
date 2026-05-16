'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, DollarSign, TrendingDown,
  ShieldAlert, Crosshair, CheckCircle, X
} from 'lucide-react'

type AdBleedType =
  | 'intent_mismatch'
  | 'cannibalization'
  | 'dead_trend'
  | 'negative_keyword'
  | 'competitor_gap'

interface AdBleedAlert {
  id: string
  bleedType: AdBleedType
  keyword: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  wastedSpend: number
  wastedSpendPeriod: string
  currentCpc: number
  conversionRate: number
  organicRank?: number
  recommendation: string
  autoFixAvailable: boolean
  resolved: boolean
}

// Mock alerts
const mockAlerts: AdBleedAlert[] = [
  {
    id: '1',
    bleedType: 'cannibalization',
    keyword: 'kelati salon houston',
    severity: 'high',
    wastedSpend: 85,
    wastedSpendPeriod: '7d',
    currentCpc: 2.50,
    conversionRate: 1.2,
    organicRank: 1,
    recommendation: 'Pause ad - already ranking #1 organically',
    autoFixAvailable: true,
    resolved: false
  },
  {
    id: '2',
    bleedType: 'intent_mismatch',
    keyword: 'how to loc hair',
    severity: 'medium',
    wastedSpend: 42,
    wastedSpendPeriod: '7d',
    currentCpc: 1.80,
    conversionRate: 0.3,
    recommendation: 'Add to negative keywords - informational intent',
    autoFixAvailable: true,
    resolved: false
  },
  {
    id: '3',
    bleedType: 'negative_keyword',
    keyword: 'diy locs tutorial',
    severity: 'low',
    wastedSpend: 18,
    wastedSpendPeriod: '7d',
    currentCpc: 0.90,
    conversionRate: 0.1,
    recommendation: 'Add "diy" and "tutorial" to negative list',
    autoFixAvailable: true,
    resolved: false
  }
]

const bleedTypeConfig = {
  intent_mismatch: {
    label: 'Intent Mismatch',
    icon: Crosshair,
    description: 'Informational keyword with transactional ad'
  },
  cannibalization: {
    label: 'Cannibalization',
    icon: ShieldAlert,
    description: 'Paid ad competing with top organic ranking'
  },
  dead_trend: {
    label: 'Dead Trend',
    icon: TrendingDown,
    description: 'High spend on declining keyword'
  },
  negative_keyword: {
    label: 'Negative Keyword',
    icon: X,
    description: 'Low-intent traffic leakage'
  },
  competitor_gap: {
    label: 'Competitor Gap',
    icon: AlertTriangle,
    description: 'Missing keyword where competitor appears'
  }
}

const severityColors = {
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
}

export function AdBleedAlerts() {
  const [alerts, setAlerts] = useState<AdBleedAlert[]>(mockAlerts)

  const totalWasted = alerts.reduce((sum, a) => sum + a.wastedSpend, 0)
  const unresolvedCount = alerts.filter(a => !a.resolved).length

  const handleAutoFix = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, resolved: true } : a
    ))
  }

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Ad Bleed Detection
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-warning" />
              <span className="font-semibold text-warning">${totalWasted}</span>
              <span className="text-muted-foreground">wasted (7d)</span>
            </div>
            <Badge variant="outline" className={severityColors.high}>
              {unresolvedCount} alerts
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Automated detection of ad spend inefficiencies
        </p>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-foreground font-medium">No ad bleed detected</p>
            <p className="text-sm text-muted-foreground">Your campaigns are running efficiently</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const bleedType = bleedTypeConfig[alert.bleedType]
              const BleedIcon = bleedType.icon

              if (alert.resolved) {
                return (
                  <div key={alert.id} className="p-3 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Resolved: {alert.keyword}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border border-border hover:border-warning/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={severityColors[alert.severity]}>
                        <BleedIcon className="h-3 w-3 mr-1" />
                        {bleedType.label}
                      </Badge>
                      <span className="font-medium text-foreground">{alert.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-warning font-bold">
                        -${alert.wastedSpend}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{alert.wastedSpendPeriod}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">CPC</p>
                      <p className="font-medium">${alert.currentCpc.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conv. Rate</p>
                      <p className="font-medium">{alert.conversionRate}%</p>
                    </div>
                    {alert.organicRank && (
                      <div>
                        <p className="text-muted-foreground">Organic Rank</p>
                        <p className="font-medium text-success">#{alert.organicRank}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded bg-muted/50 mb-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Recommendation:</span>{' '}
                      {alert.recommendation}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {alert.autoFixAvailable && (
                      <Button
                        size="sm"
                        className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                        onClick={() => handleAutoFix(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Auto Fix
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
