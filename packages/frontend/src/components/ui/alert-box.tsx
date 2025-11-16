import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

export type AlertVariant = "default" | "success" | "warning" | "info" | "destructive"

interface AlertBoxProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

const variantConfig: Record<AlertVariant, { className: string; icon: React.ReactNode }> = {
  default: {
    className: "bg-muted border-border text-foreground",
    icon: <Info className="h-5 w-5" />
  },
  success: {
    className: "bg-success/10 border-success/20 text-success-foreground",
    icon: <CheckCircle2 className="h-5 w-5 text-success" />
  },
  warning: {
    className: "bg-warning/10 border-warning/20 text-warning-foreground",
    icon: <AlertTriangle className="h-5 w-5 text-warning" />
  },
  info: {
    className: "bg-info/10 border-info/20 text-info-foreground",
    icon: <Info className="h-5 w-5 text-info" />
  },
  destructive: {
    className: "bg-destructive/10 border-destructive/20 text-destructive-foreground",
    icon: <AlertCircle className="h-5 w-5 text-destructive" />
  }
}

export function AlertBox({
  variant = "default",
  title,
  children,
  className,
  icon
}: AlertBoxProps) {
  const config = variantConfig[variant]
  const displayIcon = icon !== undefined ? icon : config.icon

  return (
    <div className={cn(
      "rounded-lg border p-4",
      config.className,
      className
    )}>
      <div className="flex gap-3">
        {displayIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {displayIcon}
          </div>
        )}
        <div className="flex-1 space-y-1">
          {title && (
            <p className="font-medium leading-none">{title}</p>
          )}
          <div className={cn("text-sm", title && "opacity-90")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
