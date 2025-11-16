import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type MCPCategory =
  | "memory"
  | "filesystem"
  | "database"
  | "api"
  | "search"
  | "communication"
  | "monitoring"
  | "development"
  | "custom"

interface CategoryBadgeProps {
  category: MCPCategory
  className?: string
  variant?: "default" | "outline"
}

const categoryConfig: Record<MCPCategory, { label: string; className: string }> = {
  memory: {
    label: "Memory",
    className: "bg-category-memory text-category-memory-foreground hover:bg-category-memory/90"
  },
  filesystem: {
    label: "Filesystem",
    className: "bg-category-filesystem text-category-filesystem-foreground hover:bg-category-filesystem/90"
  },
  database: {
    label: "Database",
    className: "bg-category-database text-category-database-foreground hover:bg-category-database/90"
  },
  api: {
    label: "API",
    className: "bg-category-api text-category-api-foreground hover:bg-category-api/90"
  },
  search: {
    label: "Search",
    className: "bg-category-search text-category-search-foreground hover:bg-category-search/90"
  },
  communication: {
    label: "Communication",
    className: "bg-category-communication text-category-communication-foreground hover:bg-category-communication/90"
  },
  monitoring: {
    label: "Monitoring",
    className: "bg-category-monitoring text-category-monitoring-foreground hover:bg-category-monitoring/90"
  },
  development: {
    label: "Development",
    className: "bg-category-development text-category-development-foreground hover:bg-category-development/90"
  },
  custom: {
    label: "Custom",
    className: "bg-category-custom text-category-custom-foreground hover:bg-category-custom/90"
  }
}

export function CategoryBadge({ category, className, variant = "default" }: CategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.custom

  if (variant === "outline") {
    return (
      <Badge variant="outline" className={cn("border-current", className)}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
