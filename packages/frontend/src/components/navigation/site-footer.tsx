import Link from 'next/link'

const CONTRACT_ADDRESS = '0xf8d7044d657b602194fb5745c614beb35d5d898a'

export function SiteFooter() {
  return (
    <footer className="border-t py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-3">OpenConductor</h3>
            <p className="text-sm text-muted-foreground">
              The identity layer for AI agents. Registration, governance, and compliance for the agentic era.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Trust Stack</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Register Agent
                </Link>
              </li>
              <li>
                <Link href="/trust-stack" className="hover:text-foreground transition-colors">
                  Trust Stack
                </Link>
              </li>
              <li>
                <Link href="/early-access" className="hover:text-foreground transition-colors">
                  Early Access
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Developers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Contract ↗
                </a>
              </li>
              <li>
                <a
                  href="https://thegraph.com/studio/subgraph/openconductor/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Subgraph ↗
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/epicmotionSD/openconductor"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub ↗
                </a>
              </li>
              <li>
                <Link href="/servers" className="hover:text-foreground transition-colors">
                  MCP Server Directory
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://discord.gg/Ya5TPWeS"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Discord ↗
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/OpenConductor"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  X / Twitter ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024-2026 OpenConductor. The identity layer for AI agents.</p>
        </div>
      </div>
    </footer>
  )
}
