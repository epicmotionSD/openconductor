import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

interface GradientButtonProps extends ButtonProps {
  glow?: boolean
}

export function GradientButton({
  className,
  glow = false,
  children,
  ...props
}: GradientButtonProps) {
  return (
    <Button
      className={cn(
        "bg-gradient-primary text-white hover:opacity-90 transition-smooth",
        glow && "shadow-glow-purple",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
