'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InstallTimer } from './install-timer'
import { Terminal, ArrowRight, Copy, Check, Zap, XCircle, CheckCircle } from 'lucide-react'

interface Server {
  id: string
  name: string
  emoji: string
  slug: string
  description: string
  category: string
}

const popularServers: Server[] = [
  {
    id: 'github',
    name: 'GitHub',
    emoji: '🐙',
    slug: 'github',
    description: 'Search repos, issues, PRs, and code',
    category: 'Development',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    emoji: '📁',
    slug: 'filesystem',
    description: 'Read, write, and search local files',
    category: 'Essential',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    emoji: '🐘',
    slug: 'postgres',
    description: 'Query and manage databases',
    category: 'Database',
  },
]

export function TryNowHero() {
  const [selectedServer, setSelectedServer] = useState<Server>(popularServers[0])
  const [copied, setCopied] = useState(false)
  const [timerActive, setTimerActive] = useState(false)

  const command = `openconductor install ${selectedServer.slug}`

  const handleServerChange = (server: Server) => {
    setSelectedServer(server)
    setTimerActive(false)
    setCopied(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimerActive(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto mb-12 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-xl">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">See the difference</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No more JSON config files. Just one command.
            </p>

            {/* Server Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {popularServers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => handleServerChange(server)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedServer.id === server.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{server.emoji}</div>
                  <div className="text-xs font-semibold">{server.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{server.category}</div>
                </button>
              ))}
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {/* The Old Way - JSON Hell */}
              <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-500">The Old Way</span>
                </div>
                <code className="block text-xs bg-slate-950 text-slate-100 px-3 py-2 rounded border border-slate-800 font-mono overflow-x-auto">
                  <div className="text-muted-foreground">// Edit claude_desktop_config.json</div>
                  <div className="text-red-400">{"{"}</div>
                  <div className="text-red-400 ml-2">"mcpServers": {"{"}</div>
                  <div className="text-red-400 ml-4">"{selectedServer.slug}": {"{"}</div>
                  <div className="text-red-400 ml-6">"command": "..."</div>
                  <div className="text-red-400 ml-4">{"}"}</div>
                  <div className="text-red-400 ml-2">{"}"}</div>
                  <div className="text-red-400">{"}"}</div>
                </code>
                <p className="text-xs text-muted-foreground mt-2">Complex, error-prone, manual editing</p>
              </div>

              {/* The New Way - OpenConductor */}
              <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-semibold text-green-500">With OpenConductor</span>
                </div>
                <code className="block text-xs bg-slate-950 text-slate-100 px-3 py-2 rounded border border-slate-800 font-mono overflow-x-auto">
                  {command}
                </code>
                <p className="text-xs text-muted-foreground mt-2">One command. Done in 10 seconds.</p>
              </div>
            </div>

            {/* Main CTA */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <code className="flex-1 text-sm bg-slate-950 text-slate-100 px-4 py-3 rounded-lg border border-slate-800 font-mono overflow-x-auto">
                {command}
              </code>
              <Button
                onClick={handleCopy}
                size="default"
                className="shadow-lg shadow-primary/25 w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span>{selectedServer.description}</span>
            </div>

            {/* Install Timer */}
            <InstallTimer key={selectedServer.id} isActive={timerActive} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
