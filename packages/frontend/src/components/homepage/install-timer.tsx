'use client'

import { useEffect, useState } from 'react'
import { Timer, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface InstallTimerProps {
  isActive: boolean
  onComplete?: () => void
}

export function InstallTimer({ isActive, onComplete }: InstallTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const TARGET_SECONDS = 10

  useEffect(() => {
    if (!isActive) {
      setSeconds(0)
      setIsComplete(false)
      return
    }

    if (seconds >= TARGET_SECONDS) {
      setIsComplete(true)
      onComplete?.()
      return
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= TARGET_SECONDS) {
          clearInterval(interval)
          return TARGET_SECONDS
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, seconds, onComplete])

  if (!isActive) return null

  const progress = (seconds / TARGET_SECONDS) * 100

  return (
    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                Setup complete!
              </span>
            </>
          ) : (
            <>
              <Timer className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-semibold">
                Setting up your environment...
              </span>
            </>
          )}
        </div>
        <span className="text-sm font-mono font-bold text-primary">
          {seconds}s / {TARGET_SECONDS}s
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      {isComplete && (
        <p className="mt-2 text-xs text-muted-foreground">
          🎉 You're ready to code with Claude! Your MCP servers are configured.
        </p>
      )}

      {!isComplete && (
        <p className="mt-2 text-xs text-muted-foreground">
          Installing {TARGET_SECONDS - seconds} more {TARGET_SECONDS - seconds === 1 ? 'second' : 'seconds'} to productivity
        </p>
      )}
    </div>
  )
}
