import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  elevated?: boolean
}

export function GlassCard({
  children,
  className,
  elevated = false,
  ...props
}: GlassCardProps) {
  return (
    <div className={cn(
      elevated ? "glass-elevated" : "glass",
      "rounded-lg p-6 transition-smooth",
      className
    )} {...props}>
      {children}
    </div>
  )
}
