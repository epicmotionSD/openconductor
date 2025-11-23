import Link from 'next/link'
import { Terminal, Menu } from 'lucide-react'
import { PROJECT_CONFIG } from '@openconductor/shared'
import { GradientText } from '@/components/ui/gradient-text'

interface SiteHeaderProps {
  variant?: 'default' | 'minimal'
}

export function SiteHeader({ variant = 'default' }: SiteHeaderProps) {
  return (
    <header className="border-b border-primary/20 backdrop-blur-md bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <Terminal className="h-8 w-8 text-primary group-hover:text-primary-light transition-colors" />
          <span className="text-2xl font-bold">
            <GradientText>OpenConductor</GradientText>
          </span>
        </Link>

        {variant === 'default' && (
          <>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/discover" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
                Discover
              </Link>
              <Link href="/docs" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
                Docs
              </Link>
              <a href={PROJECT_CONFIG.github.url} className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
                GitHub
              </a>
            </nav>
            <button className="md:hidden hover:text-primary transition-colors">
              <Menu className="h-6 w-6 text-foreground-secondary" />
            </button>
          </>
        )}

        {variant === 'minimal' && (
          <nav className="flex space-x-6">
            <Link href="/docs" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
              Docs
            </Link>
            <Link href="/install" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
              Install CLI
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
