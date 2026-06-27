'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, DollarSign, TrendingDown,
  ShieldAlert, Crosshair, CheckCircle, X
} from 'lucide-react'

type BillingIssueType =
  | 'demo_mode_in_prod'
  | 'tier_mismatch'
  | 'abandoned_server'
  | 'unbilled_calls'
  | 'missing_attestation'

interface BillingAlert {
  id: string
  issueType: BillingIssueType
  serverName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  leakedRevenue: number
  leakedRevenuePeriod: string
  costPerCall: number
  billThruRate: number
  installRank?: number
  recommendation: string
  autoFixAvailable: boolean
  resolved: boolean
}

// Mock alerts — billing hygiene + Trust Stack signals across hosted MCP servers
const mockAlerts: BillingAlert[] = [
  {
    id: '1',
    issueType: 'demo_mode_in_prod',
    serverName: 'mcp-prod-search',
    severity: 'high',
    leakedRevenue: 85,
    leakedRevenuePeriod: '7d',
    costPerCall: 2.50,
    billThruRate: 1.2,
    installRank: 1,
    recommendation: 'Server is in demo mode but receiving paid traffic — set OPENCONDUCTOR_API_KEY to enable credit deduction',
    autoFixAvailable: true,
    resolved: false
  },
  {
    id: '2',
    issueType: 'tier_mismatch',
    serverName: 'memory-bank-mcp',
    severity: 'medium',
    leakedRevenue: 42,
    leakedRevenuePeriod: '7d',
    costPerCall: 1.80,
    billThruRate: 0.3,
    recommendation: 'Hobby-tier customer averaging pro-tier usage — upsell or rate-limit',
    autoFixAvailable: true,
    resolved: false
  },
  {
    id: '3',
    issueType: 'unbilled_calls',
    serverName: 'trends-mcp',
    severity: 'low',
    leakedRevenue: 18,
    leakedRevenuePeriod: '7d',
    costPerCall: 0.90,
    billThruRate: 0.1,
    recommendation: 'Calls falling through to the demo-mode 9999-credit pool — verify customer key rotation',
    autoFixAvailable: true,
    resolved: false
  }
]

const issueTypeConfig = {
  tier_mismatch: {
    label: 'Tier Mismatch',
    icon: Crosshair,
    description: 'Customer usage exceeds plan tier'
  },
  demo_mode_in_prod: {
    label: 'Demo Mode in Prod',
    icon: ShieldAlert,
    description: 'Production traffic served by a demo-mode server (no credits deducted)'
  },
  abandoned_server: {
    label: 'Abandoned Server',
    icon: TrendingDown,
    description: 'High provisioned spend, low active installs'
  },
  unbilled_calls: {
    label: 'Unbilled Calls',
    icon: X,
    description: 'Tool invocations falling through to demo fallback'
  },
  missing_attestation: {
    label: 'Missing Attestation',
    icon: AlertTriangle,
    description: 'Registered agent without ERC-8004 attestation'
  }
}

const severityColors = {
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
}

export function BillingHygiene() {
  const [alerts, setAlerts] = useState<BillingAlert[]>(mockAlerts)

  const totalLeaked = alerts.reduce((sum, a) => sum + a.leakedRevenue, 0)
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
            Billing Hygiene
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-warning" />
              <span className="font-semibold text-warning">${totalLeaked}</span>
              <span className="text-muted-foreground">leaked (7d)</span>
            </div>
            <Badge variant="outline" className={severityColors.high}>
              {unresolvedCount} alerts
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Revenue leaks across the monetization layer — demo-mode prod traffic, tier mismatches, missed attestations
        </p>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-foreground font-medium">No billing leaks detected</p>
            <p className="text-sm text-muted-foreground">Every paid call is being credited cleanly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const issue = issueTypeConfig[alert.issueType]
              const IssueIcon = issue.icon

              if (alert.resolved) {
                return (
                  <div key={alert.id} className="p-3 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Resolved: {alert.serverName}</span>
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
                        <IssueIcon className="h-3 w-3 mr-1" />
                        {issue.label}
                      </Badge>
                      <span className="font-medium text-foreground">{alert.serverName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-warning font-bold">
                        -${alert.leakedRevenue}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{alert.leakedRevenuePeriod}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cost / call</p>
                      <p className="font-medium">${alert.costPerCall.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bill-thru rate</p>
                      <p className="font-medium">{alert.billThruRate}%</p>
                    </div>
                    {alert.installRank && (
                      <div>
                        <p className="text-muted-foreground">Install rank</p>
                        <p className="font-medium text-success">#{alert.installRank}</p>
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
