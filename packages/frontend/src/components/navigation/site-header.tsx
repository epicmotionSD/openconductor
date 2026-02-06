"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronDown, X } from 'lucide-react'
import { PROJECT_CONFIG } from '@openconductor/shared'
import { GradientText } from '@/components/ui/gradient-text'

interface SiteHeaderProps {
  variant?: 'default' | 'minimal'
}

export function SiteHeader({ variant = 'default' }: SiteHeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <header className="border-b border-primary/20 backdrop-blur-md bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <img
            src="/trust-stack-logo.svg"
            alt="OpenConductor"
            className="h-8 w-8"
          />
          <span className="text-2xl font-bold font-display">
            <GradientText>OpenConductor</GradientText>
          </span>
        </Link>

        {variant === 'default' && (
          <>
            <nav className="hidden md:flex space-x-6 items-center">
              <Link
                href="/register"
                className="text-sm font-semibold text-primary-foreground bg-primary px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
              >
                Register Agent
              </Link>

              <div className="relative group">
                <button
                  type="button"
                  className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Trust Stack
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-lg opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto transition">
                  <div className="p-2">
                    <Link href="/#trust-stack" className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      Overview
                    </Link>
                    <Link href="/#registry" className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      Layer 1: Registry
                    </Link>
                    <Link href="/#governor" className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      Layer 2: Governor
                    </Link>
                    <Link href="/#underwriter" className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      Layer 3: Underwriter
                    </Link>
                    <Link href="/#proof" className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      Layer 4: Proof
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Developers
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-lg opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto transition">
                  <div className="p-2">
                    <a
                      href="https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      Contract
                    </a>
                    <a
                      href="https://thegraph.com/studio/subgraph/openconductor/"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      Subgraph
                    </a>
                    <a
                      href={PROJECT_CONFIG.github.url}
                      className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>

              <Link href="/early-access" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
                Early Access
              </Link>
            </nav>
            <button
              className="md:hidden hover:text-primary transition-colors"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen((open) => !open)}
            >
              {isMobileOpen ? (
                <X className="h-6 w-6 text-foreground-secondary" />
              ) : (
                <Menu className="h-6 w-6 text-foreground-secondary" />
              )}
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

      {variant === 'default' && (
        <div
          className={`md:hidden border-t border-primary/10 bg-background/95 backdrop-blur-md transition-all duration-300 ease-out ${
            isMobileOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <nav
            className={`container mx-auto px-4 py-4 flex flex-col gap-4 transition-transform duration-300 ease-out ${
              isMobileOpen ? 'translate-y-0' : '-translate-y-2'
            }`}
          >
            <Link
              href="/register"
              className="text-sm font-semibold text-primary-foreground bg-primary px-4 py-3 rounded-full text-center"
              onClick={() => setIsMobileOpen(false)}
            >
              Register Agent
            </Link>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Trust Stack</div>
              <Link href="/#trust-stack" className="block text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Overview
              </Link>
              <Link href="/#registry" className="block text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 1: Registry
              </Link>
              <Link href="/#governor" className="block text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 2: Governor
              </Link>
              <Link href="/#underwriter" className="block text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 3: Underwriter
              </Link>
              <Link href="/#proof" className="block text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 4: Proof
              </Link>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Developers</div>
              <a
                href="https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a"
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-foreground-secondary"
                onClick={() => setIsMobileOpen(false)}
              >
                Contract
              </a>
              <a
                href="https://thegraph.com/studio/subgraph/openconductor/"
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-foreground-secondary"
                onClick={() => setIsMobileOpen(false)}
              >
                Subgraph
              </a>
              <a
                href={PROJECT_CONFIG.github.url}
                className="block text-sm text-foreground-secondary"
                onClick={() => setIsMobileOpen(false)}
              >
                GitHub
              </a>
            </div>

            <Link
              href="/early-access"
              className="text-sm font-medium text-foreground-secondary"
              onClick={() => setIsMobileOpen(false)}
            >
              Early Access
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
