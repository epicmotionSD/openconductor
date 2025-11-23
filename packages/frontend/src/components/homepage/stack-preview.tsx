'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CopyButton } from './copy-button'
import { ChevronDown, ChevronUp, Package, Zap } from 'lucide-react'

interface StackServer {
  name: string
  description: string
  icon: string
}

interface StackData {
  id: string
  title: string
  emoji: string
  description: string
  command: string
  servers: StackServer[]
  systemPrompt: string
}

const stacks: StackData[] = [
  {
    id: 'coder',
    title: 'Coder Stack',
    emoji: '🧑‍💻',
    description: 'Build, debug, and deploy like a senior engineer',
    command: 'openconductor stack install coder',
    systemPrompt: 'Acts as a senior software engineer with expertise in architecture, debugging, and best practices',
    servers: [
      { name: 'GitHub', description: 'Repository management and code collaboration', icon: '🐙' },
      { name: 'PostgreSQL', description: 'Database queries and schema management', icon: '🐘' },
      { name: 'Filesystem', description: 'Read, write, and manage local files', icon: '📁' },
      { name: 'Memory', description: 'Persistent context across conversations', icon: '🧠' },
      { name: 'Brave Search', description: 'Web search for documentation and solutions', icon: '🔍' },
    ],
  },
  {
    id: 'writer',
    title: 'Writer Stack',
    emoji: '✍️',
    description: 'Research, write, and publish with confidence',
    command: 'openconductor stack install writer',
    systemPrompt: 'Professional writer and researcher with expertise in content creation and fact-checking',
    servers: [
      { name: 'Brave Search', description: 'Research and fact-checking', icon: '🔍' },
      { name: 'Filesystem', description: 'Document management and editing', icon: '📁' },
      { name: 'Memory', description: 'Remember writing style and preferences', icon: '🧠' },
      { name: 'Google Drive', description: 'Cloud document storage and collaboration', icon: '☁️' },
    ],
  },
  {
    id: 'essential',
    title: 'Essential Stack',
    emoji: '⚡',
    description: 'Everything you need to get started',
    command: 'openconductor stack install essential',
    systemPrompt: 'Helpful AI assistant with core capabilities for everyday tasks',
    servers: [
      { name: 'Filesystem', description: 'File and folder operations', icon: '📁' },
      { name: 'Brave Search', description: 'Web search capabilities', icon: '🔍' },
      { name: 'Memory', description: 'Context retention', icon: '🧠' },
    ],
  },
]

interface StackCardProps {
  stack: StackData
}

function StackCard({ stack }: StackCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-border/50 hover:border-primary/50 transition-all">
      <CardContent className="p-6">
        <div className="text-4xl mb-3">{stack.emoji}</div>
        <h3 className="text-xl font-semibold mb-2">{stack.title}</h3>
        <p className="text-muted-foreground mb-4">{stack.description}</p>

        {/* Server count badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Package className="h-4 w-4" />
          <span>{stack.servers.length} servers included</span>
        </div>

        {/* Expandable server list */}
        {expanded && (
          <div className="mb-4 space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">What you'll get:</span>
            </div>
            {stack.servers.map((server, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <span className="text-lg">{server.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{server.name}</div>
                  <div className="text-muted-foreground text-xs">{server.description}</div>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                <strong>System Prompt:</strong> {stack.systemPrompt}
              </div>
            </div>
          </div>
        )}

        {/* Command */}
        <div className="flex flex-col gap-2 mb-3">
          <code className="text-xs bg-slate-950 text-slate-100 p-2 rounded block overflow-x-auto">
            {stack.command}
          </code>
          <CopyButton text={stack.command} className="w-full" />
        </div>

        {/* Toggle preview button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              Hide Details <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Preview Servers <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export function StackPreview() {
  return (
    <section className="bg-muted/30 border-y">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pre-Configured Stacks</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Install complete workflows in one command. Each stack includes servers + system prompt.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {stacks.map((stack) => (
            <StackCard key={stack.id} stack={stack} />
          ))}
        </div>
      </div>
    </section>
  )
}
