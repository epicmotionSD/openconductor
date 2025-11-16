import Link from 'next/link'
import { Terminal, Menu } from 'lucide-react'

interface SiteHeaderProps {
  variant?: 'default' | 'minimal'
}

export function SiteHeader({ variant = 'default' }: SiteHeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Terminal className="h-8 w-8 text-foreground" />
          <span className="text-2xl font-bold text-foreground">OpenConductor</span>
        </Link>

        {variant === 'default' && (
          <>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Discover
              </Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
              <a href="https://github.com/openconductor/openconductor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
            </nav>
            <button className="md:hidden">
              <Menu className="h-6 w-6 text-muted-foreground" />
            </button>
          </>
        )}

        {variant === 'minimal' && (
          <nav className="flex space-x-6">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            <Link href="/install" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Install CLI</Link>
          </nav>
        )}
      </div>
    </header>
  )
}
