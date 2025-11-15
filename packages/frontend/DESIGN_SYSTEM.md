# OpenConductor Design System

## Typography Scale

Consistent typography hierarchy across the application.

### Headings

- **H1 - Page Titles**: `text-4xl font-bold` (36px)
  - Use for main page titles (Discover, Submit, Server details, etc.)
  - Example: "Discover AI Agents for Your Stack"

- **H2 - Section Titles**: `text-2xl font-semibold` (24px)
  - Use for major sections within pages
  - Example: "Server Registry Management"

- **H3 - Subsection Titles**: `text-xl font-medium` (20px)
  - Use for subsections and card titles
  - Example: "System Health", "Background Jobs"

- **H4 - Component Titles**: `text-lg font-medium` (18px)
  - Use for smaller component headings

- **H5 - Small Titles**: `text-base font-medium` (16px)
  - Use for labels and small titles

### Special Cases

- **Hero H1 (Homepage only)**: `text-4xl md:text-5xl lg:text-6xl font-bold`
  - Responsive scaling for landing page impact

- **Admin H1**: `text-3xl font-bold`
  - Slightly smaller for admin dashboard density

- **Marketing Pages (Optional)**: `text-6xl font-bold` with gradient
  - Used for special marketing pages (Vercel, Supabase, v0 integrations)
  - Should include gradient styling for brand impact

## Color System

### Semantic Colors

All colors use CSS variables for automatic dark mode support.

#### Base Colors
- `bg-background` - Page background
- `bg-card` - Card/panel background
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary/muted text
- `border` - Border color

#### Status Colors
- `text-success` - Success states (green)
- `text-warning` - Warning states (yellow/orange)
- `text-info` - Informational (blue)
- `text-destructive` - Error/danger states (red)

#### Interactive Colors
- `text-primary` - Primary brand color, links, CTAs
- `bg-primary` - Primary button backgrounds
- `bg-muted` - Muted backgrounds (code blocks, subtle highlights)
- `bg-accent` - Accent backgrounds

### Category Colors

For MCP server categories:
- `text-category-memory` / `bg-category-memory`
- `text-category-filesystem` / `bg-category-filesystem`
- `text-category-database` / `bg-category-database`
- `text-category-api` / `bg-category-api`
- `text-category-search` / `bg-category-search`
- `text-category-communication` / `bg-category-communication`
- `text-category-monitoring` / `bg-category-monitoring`
- `text-category-development` / `bg-category-development`
- `text-category-custom` / `bg-category-custom`

## Component Library

### Reusable Components

#### CategoryBadge
Location: `src/components/ui/category-badge.tsx`

```tsx
import { CategoryBadge } from '@/components/ui/category-badge'

<CategoryBadge category="memory" />
<CategoryBadge category="database" variant="outline" />
```

#### AlertBox
Location: `src/components/ui/alert-box.tsx`

```tsx
import { AlertBox } from '@/components/ui/alert-box'

<AlertBox variant="info" title="Ecosystem Integration">
  Works with your modern AI stack out of the box.
</AlertBox>

<AlertBox variant="success">
  Deployment successful!
</AlertBox>

<AlertBox variant="warning" title="Warning">
  This action cannot be undone.
</AlertBox>
```

#### Standard UI Components
- `Button` - Primary action buttons
- `Badge` - Status indicators and labels
- `Card` - Content containers
- `Input` - Form inputs

## Spacing

Use Tailwind's spacing scale:
- `gap-2` (8px) - Tight spacing
- `gap-4` (16px) - Default spacing
- `gap-6` (24px) - Medium spacing
- `gap-8` (32px) - Large spacing

Padding/Margin:
- `p-4` / `m-4` - Default padding/margin
- `p-6` / `m-6` - Card padding
- `p-8` / `m-8` - Section padding

## Dark Mode

All components automatically support dark mode when using design system colors.

To enable dark mode:
```tsx
<html className="dark">
```

All colors using CSS variables (bg-background, text-foreground, etc.) will automatically adapt.

## Migration Checklist

When refactoring a page to use the design system:

- [ ] Replace hardcoded colors (bg-white, text-gray-600) with design tokens
- [ ] Use consistent H1 size: `text-4xl font-bold`
- [ ] Replace custom alert boxes with AlertBox component
- [ ] Replace category badge logic with CategoryBadge component
- [ ] Use Button component instead of custom styling
- [ ] Use Card component for containers
- [ ] Ensure all text uses foreground or muted-foreground
- [ ] Test in dark mode

## Examples

### Before (Hardcoded)
```tsx
<div className="bg-white border-gray-200">
  <h1 className="text-5xl text-gray-900">Title</h1>
  <p className="text-gray-600">Description</p>
  <div className="bg-blue-50 text-blue-700">
    Info message
  </div>
</div>
```

### After (Design System)
```tsx
<div className="bg-background border">
  <h1 className="text-4xl font-bold text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <AlertBox variant="info">
    Info message
  </AlertBox>
</div>
```
