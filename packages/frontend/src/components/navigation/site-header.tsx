"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronDown, X, Shield, ArrowRight } from 'lucide-react'
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
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-lg opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto transition">
                  <div className="p-2">
                    <Link href="/trust-stack" className="flex items-start gap-3 px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      <Shield className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Overview</div>
                        <div className="text-xs text-muted-foreground">4-layer compliance infrastructure</div>
                      </div>
                    </Link>
                    <Link href="/trust-stack#registry" className="flex items-start gap-3 px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      <div className="h-4 w-4 mt-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center">1</div>
                      <div>
                        <div className="font-medium text-foreground">Registry <span className="text-[10px] text-green-400 ml-1">LIVE</span></div>
                        <div className="text-xs text-muted-foreground">ERC-8004 on-chain identity</div>
                      </div>
                    </Link>
                    <Link href="/trust-stack#governor" className="flex items-start gap-3 px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      <div className="h-4 w-4 mt-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center">2</div>
                      <div>
                        <div className="font-medium text-foreground">Governor <span className="text-[10px] text-yellow-400 ml-1">Q2</span></div>
                        <div className="text-xs text-muted-foreground">AP2 policy engine</div>
                      </div>
                    </Link>
                    <Link href="/trust-stack#underwriter" className="flex items-start gap-3 px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      <div className="h-4 w-4 mt-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center justify-center">3</div>
                      <div>
                        <div className="font-medium text-foreground">Underwriter <span className="text-[10px] text-yellow-400 ml-1">Q3</span></div>
                        <div className="text-xs text-muted-foreground">Risk scoring & insurance</div>
                      </div>
                    </Link>
                    <Link href="/trust-stack#proof" className="flex items-start gap-3 px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors">
                      <div className="h-4 w-4 mt-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center">4</div>
                      <div>
                        <div className="font-medium text-foreground">Proof <span className="text-[10px] text-blue-400 ml-1">REF</span></div>
                        <div className="text-xs text-muted-foreground">x3o.ai Command Center</div>
                      </div>
                    </Link>
                    <div className="border-t border-primary/10 my-2" />
                    <Link href="/trust-stack" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                      Deep Dive <ArrowRight className="h-3 w-3" />
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
                      ERC-8004 Contract ↗
                    </a>
                    <a
                      href="https://thegraph.com/studio/subgraph/openconductor/"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      Subgraph (The Graph) ↗
                    </a>
                    <a
                      href={PROJECT_CONFIG.github.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      GitHub ↗
                    </a>
                    <div className="border-t border-primary/10 my-2" />
                    <Link
                      href="/servers"
                      className="block px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      MCP Server Directory
                    </Link>
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
            <Link href="/register" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
              Register Agent
            </Link>
            <Link href="/trust-stack" className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors">
              Trust Stack
            </Link>
          </nav>
        )}
      </div>

      {/* Mobile Menu */}
      {variant === 'default' && (
        <div
          className={`md:hidden border-t border-primary/10 bg-background/95 backdrop-blur-md transition-all duration-300 ease-out ${
            isMobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
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
              <Link href="/trust-stack" className="block text-sm text-foreground font-medium" onClick={() => setIsMobileOpen(false)}>
                Overview →
              </Link>
              <Link href="/trust-stack#registry" className="flex items-center gap-2 text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 1: Registry <span className="text-[10px] text-green-400">LIVE</span>
              </Link>
              <Link href="/trust-stack#governor" className="flex items-center gap-2 text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 2: Governor <span className="text-[10px] text-yellow-400">Q2</span>
              </Link>
              <Link href="/trust-stack#underwriter" className="flex items-center gap-2 text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 3: Underwriter <span className="text-[10px] text-yellow-400">Q3</span>
              </Link>
              <Link href="/trust-stack#proof" className="flex items-center gap-2 text-sm text-foreground-secondary" onClick={() => setIsMobileOpen(false)}>
                Layer 4: Proof <span className="text-[10px] text-blue-400">REF</span>
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
                ERC-8004 Contract ↗
              </a>
              <a
                href="https://thegraph.com/studio/subgraph/openconductor/"
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-foreground-secondary"
                onClick={() => setIsMobileOpen(false)}
              >
                Subgraph ↗
              </a>
              <a
                href={PROJECT_CONFIG.github.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-foreground-secondary"
                onClick={() => setIsMobileOpen(false)}
              >
                GitHub ↗
              </a>
              <Link
                href="/servers"
                className="block text-sm text-foreground-secondary"
                onClick={() => setIsMobileOpen(false)}
              >
                MCP Server Directory
              </Link>
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
