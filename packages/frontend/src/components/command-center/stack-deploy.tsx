'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Layout, FileText, Image, BookOpen, GitCompare,
  ShoppingBag, MapPin, Mail, Star, Link2,
  Rocket, ChevronDown, Check
} from 'lucide-react'

type StackId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S10'

interface Stack {
  id: StackId
  name: string
  purpose: string
  category: 'core' | 'support' | 'premium' | 'meta'
  icon: typeof Layout
  installCount: number
  successRate: number
}

const stacks: Stack[] = [
  { id: 'S01', name: 'Coder Stack',         purpose: 'Build, debug, deploy like a senior engineer', category: 'core',    icon: Layout,      installCount: 24, successRate: 8.5 },
  { id: 'S02', name: 'Writer Stack',        purpose: 'Research, write, publish with confidence',    category: 'core',    icon: FileText,    installCount: 18, successRate: 12.3 },
  { id: 'S03', name: 'Essential Stack',     purpose: 'Everything you need to get started',          category: 'core',    icon: Image,       installCount: 15, successRate: 4.2 },
  { id: 'S04', name: 'Memory & RAG Stack',  purpose: 'Persistent context + vector search',          category: 'support', icon: BookOpen,    installCount: 32, successRate: 2.1 },
  { id: 'S05', name: 'Browser Automation',  purpose: 'Puppeteer, Playwright, Firecrawl',            category: 'support', icon: GitCompare,  installCount: 8,  successRate: 6.8 },
  { id: 'S06', name: 'Database Stack',      purpose: 'Postgres, Redis, BigQuery, Snowflake',        category: 'premium', icon: ShoppingBag, installCount: 12, successRate: 5.4 },
  { id: 'S07', name: 'AI & LLMs',           purpose: 'OpenAI, Replicate, Hugging Face',             category: 'premium', icon: MapPin,      installCount: 45, successRate: 9.2 },
  { id: 'S08', name: 'Productivity Stack',  purpose: 'Notion, Slack, Linear, Google Drive',         category: 'support', icon: Mail,        installCount: 10, successRate: 15.6 },
  { id: 'S09', name: 'Search Stack',        purpose: 'Brave Search, Tavily, web crawl',             category: 'support', icon: Star,        installCount: 6,  successRate: 3.8 },
  { id: 'S10', name: 'DevOps Stack',        purpose: 'GitHub, Docker, Kubernetes, CI',              category: 'meta',    icon: Link2,       installCount: 4,  successRate: 22.1 },
]

const categoryColors = {
  core:    'bg-green-500/10 text-green-500 border-green-500/20',
  support: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  premium: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  meta:    'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export function StackDeploy() {
  const [selectedStack, setSelectedStack] = useState<StackId | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleStacks = isExpanded ? stacks : stacks.slice(0, 4)
  const selected = stacks.find(s => s.id === selectedStack)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Stack Deploy
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Install a pre-configured MCP stack into Claude Desktop, Cursor, Cline, or Windsurf
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleStacks.map((stack) => {
            const StackIcon = stack.icon
            const isSelected = selectedStack === stack.id

            return (
              <div
                key={stack.id}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                  }
                `}
                onClick={() => setSelectedStack(isSelected ? null : stack.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded flex items-center justify-center
                      ${isSelected ? 'bg-primary/10' : 'bg-muted'}
                    `}>
                      <StackIcon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{stack.name}</span>
                        <Badge variant="outline" className={`text-xs ${categoryColors[stack.category]}`}>
                          {stack.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{stack.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {stack.installCount} installs
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!isExpanded && (
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setIsExpanded(true)}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Show all stacks
          </Button>
        )}

        {selectedStack && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Target client</label>
                <input
                  type="text"
                  placeholder="claude-desktop, cursor, cline, windsurf"
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Customer / project name</label>
                <input
                  type="text"
                  placeholder="e.g., acme-corp"
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                />
              </div>
              <Button className="w-full bg-primary">
                <Rocket className="h-4 w-4 mr-2" />
                Install {selected?.name}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
