# OpenConductor Roadmap

## Vision

OpenConductor is evolving from an MCP server registry into **Trust Stack** - the identity and compliance layer for autonomous AI agents. As AI agents proliferate in 2026 and beyond, enterprises need infrastructure to verify, govern, and insure agent operations.

## Current Status

### Registry - Live ✅
- **CLI**: 1,000+ weekly npm downloads
- **Servers**: 220+ indexed and verified
- **Clients**: Claude Desktop, Cursor, Cline, Windsurf
- **Stacks**: Pre-configured workflows with system prompts

### Trust Stack Layer 1: Registry - Live on Testnet ✅

**ERC-8004 Agent Identity Registry**
- Contract: `0xf8d7044d657b602194fb5745c614beb35d5d898a` (Base Sepolia)
- Explorer: [BaseScan](https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a)
- First agent registered: Token ID #1

**Subgraph Indexer**
- Deployed: [The Graph Studio](https://thegraph.com/studio/subgraph/openconductor/)
- Indexes: Agent registrations, attestations, trust scores, tier upgrades
- GraphQL API for querying on-chain agent data

**Registration UI**
- Live at: [openconductor.ai/register](https://openconductor.ai/register)
- Wallet integration (MetaMask, Coinbase, WalletConnect)
- On-chain metadata storage

---

## 2026 Roadmap

### Q1 2026 - Foundation ✅

| Milestone | Status | Details |
|-----------|--------|---------|
| ERC-8004 Spec | ✅ Complete | Agent identity standard for on-chain registration |
| Testnet Deploy | ✅ Complete | Base Sepolia deployment with first agent |
| Subgraph | ✅ Complete | The Graph Studio indexer for agent queries |
| Registration UI | ✅ Complete | Wallet-connected registration flow |
| CLI 1.0 | ✅ Complete | 1,000+ weekly downloads |

### Q2 2026 - Governor Layer

| Milestone | Status | Details |
|-----------|--------|---------|
| Mainnet Deploy | 🔜 Planned | Base mainnet ERC-8004 deployment |
| AP2 Policy Engine | 🔜 Planned | Permission management for agent operations |
| Team Workspaces | 🔜 Planned | Multi-user agent management |
| Attestation Framework | 🔜 Planned | Third-party verification system |

### Q3 2026 - Underwriter Layer

| Milestone | Status | Details |
|-----------|--------|---------|
| Risk Scoring | 🔜 Planned | Algorithmic trust score computation |
| ISO 42001 Tooling | 🔜 Planned | AI management system compliance |
| Insurance API | 🔜 Planned | Agent operation insurance integration |
| Audit Trails | 🔜 Planned | Immutable operation logging |

### Q4 2026 - Scale

| Milestone | Status | Details |
|-----------|--------|---------|
| Multi-chain | 🔜 Planned | Ethereum, Arbitrum, Optimism support |
| Enterprise SSO | 🔜 Planned | SAML/OIDC integration |
| Agent Marketplace | 🔜 Planned | Verified agent discovery |
| SDK 2.0 | 🔜 Planned | Full Trust Stack SDK |

---

## Regulatory Context

### EU AI Act (Effective August 2026)
- High-risk AI systems require identity tracking
- Audit trails mandatory for enterprise AI
- Trust Stack provides compliant infrastructure

### Why Now
- AI agents are proliferating faster than governance
- Enterprises need verifiable agent identities
- Insurance companies need risk assessment data
- OpenConductor is positioned at the plumbing level

---

## Architecture

`
┌─────────────────────────────────────────────────────────┐
│                    Trust Stack                          │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Proof      │ Reference implementations       │
│                      │ x3o.ai Command Center            │
├──────────────────────┼──────────────────────────────────┤
│  Layer 3: Underwriter│ Risk scoring, ISO 42001         │
│                      │ Insurance integration            │
├──────────────────────┼──────────────────────────────────┤
│  Layer 2: Governor   │ AP2 policy engine               │
│                      │ Permission management            │
├──────────────────────┼──────────────────────────────────┤
│  Layer 1: Registry   │ ERC-8004 Agent Identity ✅       │
│                      │ On-chain registration            │
└─────────────────────────────────────────────────────────┘
`

---

## Links

- **Website**: [openconductor.ai](https://openconductor.ai)
- **Registry**: [openconductor.ai/discover](https://openconductor.ai/discover)
- **Register Agent**: [openconductor.ai/register](https://openconductor.ai/register)
- **Contract**: [BaseScan](https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a)
- **Subgraph**: [The Graph Studio](https://thegraph.com/studio/subgraph/openconductor/)
- **Discord**: [discord.gg/openconductor](https://discord.gg/openconductor)

---

*Last updated: February 2026*
