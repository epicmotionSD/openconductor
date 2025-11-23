'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Download, Package, Zap } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'stack' | 'server' | 'install'
  action: string
  item: string
  timeAgo: string
  icon: string
}

// Simulated activity data that rotates
const activityPool: Omit<ActivityItem, 'id' | 'timeAgo'>[] = [
  { type: 'stack', action: 'installed', item: 'Coder Stack', icon: '🧑‍💻' },
  { type: 'server', action: 'added', item: 'filesystem-server', icon: '📁' },
  { type: 'stack', action: 'installed', item: 'Writer Stack', icon: '✍️' },
  { type: 'server', action: 'added', item: 'github-server', icon: '🐙' },
  { type: 'stack', action: 'installed', item: 'Essential Stack', icon: '⚡' },
  { type: 'server', action: 'added', item: 'postgres-server', icon: '🐘' },
  { type: 'server', action: 'added', item: 'memory-server', icon: '🧠' },
  { type: 'server', action: 'added', item: 'brave-search', icon: '🔍' },
  { type: 'install', action: 'completed', item: 'OpenConductor CLI', icon: '⚡' },
]

function generateActivity(): ActivityItem {
  const item = activityPool[Math.floor(Math.random() * activityPool.length)]
  const minutesAgo = Math.floor(Math.random() * 30) + 1

  return {
    ...item,
    id: `${Date.now()}-${Math.random()}`,
    timeAgo: minutesAgo === 1 ? '1 min ago' : `${minutesAgo} mins ago`,
  }
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([
    generateActivity(),
    generateActivity(),
    generateActivity(),
    generateActivity(),
  ])
  const [totalToday, setTotalToday] = useState(Math.floor(Math.random() * 50) + 30)

  useEffect(() => {
    // Update activities every 8-15 seconds
    const interval = setInterval(() => {
      const newActivity = generateActivity()
      setActivities((prev) => [newActivity, ...prev.slice(0, 3)])
      setTotalToday((prev) => prev + 1)
    }, Math.floor(Math.random() * 7000) + 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-lg font-semibold">Live Activity</h3>
        </div>

        <div className="space-y-3 mb-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                index === 0 ? 'animate-fade-in' : ''
              }`}
            >
              <span className="text-lg flex-shrink-0">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">{activity.item}</span>
                <span className="text-muted-foreground text-xs">{activity.action}</span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.timeAgo}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Download className="h-4 w-4" />
              <span>Today</span>
            </div>
            <Badge variant="outline" className="font-semibold">
              {totalToday} installs
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
