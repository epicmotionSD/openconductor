'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InstallTimer } from './install-timer'
import { Terminal, ArrowRight, Copy, Check, Zap } from 'lucide-react'

interface Stack {
  id: string
  name: string
  emoji: string
  description: string
  servers: string[]
  serverCount: number
}

const stacks: Stack[] = [
  {
    id: 'coder',
    name: 'Coder Stack',
    emoji: '🧑‍💻',
    description: 'Build, debug, and deploy like a senior engineer',
    servers: ['GitHub', 'PostgreSQL', 'Filesystem', 'Memory', 'Brave Search'],
    serverCount: 5,
  },
  {
    id: 'writer',
    name: 'Writer Stack',
    emoji: '✍️',
    description: 'Research, write, and publish with confidence',
    servers: ['Brave Search', 'Filesystem', 'Memory', 'Google Drive'],
    serverCount: 4,
  },
  {
    id: 'essential',
    name: 'Essential Stack',
    emoji: '⚡',
    description: 'Everything you need to get started',
    servers: ['Filesystem', 'Brave Search', 'Memory'],
    serverCount: 3,
  },
]

export function TryNowHero() {
  const [selectedStack, setSelectedStack] = useState<Stack>(stacks[0])
  const [copied, setCopied] = useState(false)
  const [timerActive, setTimerActive] = useState(false)

  const command = `npx @openconductor/cli stack install ${selectedStack.id}`

  const handleStackChange = (stack: Stack) => {
    setSelectedStack(stack)
    // Reset timer when changing stacks
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
            <h3 className="text-lg font-semibold mb-2">Try it right now</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a stack and copy the command. No signup required.
            </p>

            {/* Stack Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {stacks.map((stack) => (
                <button
                  key={stack.id}
                  onClick={() => handleStackChange(stack)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedStack.id === stack.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{stack.emoji}</div>
                  <div className="text-xs font-semibold">{stack.name}</div>
                </button>
              ))}
            </div>

            {/* Selected Stack Preview */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">You'll get:</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{selectedStack.description}</p>
              <div className="flex flex-wrap gap-1">
                {selectedStack.servers.map((server, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
                  >
                    {server}
                  </span>
                ))}
              </div>
            </div>

            {/* Command */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <code className="flex-1 text-xs md:text-sm bg-slate-950 text-slate-100 px-4 py-3 rounded-lg border border-slate-800 font-mono overflow-x-auto">
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
              <span>Sets up {selectedStack.serverCount} servers + system prompt in 10 seconds</span>
            </div>

            {/* Install Timer */}
            <InstallTimer key={selectedStack.id} isActive={timerActive} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
