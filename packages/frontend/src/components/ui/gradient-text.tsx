import { cn } from "@/lib/utils"

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  animated?: boolean
}

export function GradientText({
  children,
  className,
  animated = false
}: GradientTextProps) {
  return (
    <span className={cn(
      "gradient-text",
      animated && "gradient-text-animated",
      className
    )}>
      {children}
    </span>
  )
}
