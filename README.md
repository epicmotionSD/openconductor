<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/banner-light.svg">
    <img src="assets/brand/banner-light.svg" alt="OpenConductor - Identity, Compliance & Monetization for AI Agents" width="600" />
  </picture>
</p>

<p align="center">
  <strong>The monetization infrastructure layer for the agent economy.</strong><br/>
  One-line <code>requirePayment()</code> for MCP servers, with a hosted billing API and Stripe credit packs.<br/>
  Plus Trust Stack identity and compliance for the August 2026 EU AI Act deadline.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@openconductor/cli"><img src="https://img.shields.io/npm/v/@openconductor/cli.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@openconductor/cli"><img src="https://img.shields.io/npm/dw/@openconductor/cli.svg" alt="npm downloads"></a>
  <a href="https://github.com/epicmotionSD/openconductor/stargazers"><img src="https://img.shields.io/github/stars/epicmotionSD/openconductor.svg" alt="GitHub stars"></a>
  <a href="https://github.com/epicmotionSD/openconductor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://openconductor.ai">Website</a> •
  <a href="#trust-stack">Trust Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="https://www.npmjs.com/package/@openconductor/mcp-sdk">SDK</a> •
  <a href="https://api.openconductor.ai">API</a> •
  <a href="https://discord.gg/openconductor">Discord</a>
</p>

---

## The Agent Economy Needs Infrastructure

Jensen Huang called it at GTC 2026: **every company becomes an agent company.** SaaS becomes AaaS. OpenClaw is building the operating system for personal AI. NemoClaw secures the network connection.

**But who secures the identity?** Who's liable when an agent acts? Who ensures EU AI Act compliance? Who handles monetization?

That's OpenConductor. We're building **Trust Stack + Monetization** — identity, compliance, API keys, and one-line billing that makes agents enterprise-ready and revenue-ready.

| Layer | What It Does | Status |
|-------|-------------|--------|
| **Registry** | 220+ MCP servers indexed. Discovery, installation, stacks. | ✅ Live |
| **Identity** | ERC-8004 on-chain agent identity. Verifiable, auditable, portable. | ✅ Live on Base Sepolia |
| **Governance** | Policy engine, permission management, attestation framework. | Q2 2026 |
| **Compliance** | EU AI Act readiness, ISO 42001, audit trails, insurance API. | Q3 2026 |
| **Monetization** | `requirePayment()` middleware, credit packs, Stripe checkout, hosted billing API at `api.openconductor.ai`. | ✅ Live |

> **The analogy:** OpenClaw built the highway. NemoClaw built the traffic rules. OpenConductor is the DMV — registration, licensing, insurance, accountability.

---

## OpenClaw + Trust Stack

OpenConductor sits on top of the OpenClaw ecosystem as the compliance and identity layer. Any OpenClaw agent can be wrapped with Trust Stack to get:

- **On-chain identity** via ERC-8004 — verifiable agent registration
- **EU AI Act compliance metadata** — ready for August 2026 enforcement
- **Audit trails** — immutable operation logging
- **Monetization** — one-line payment middleware for agent actions
- **Trust scores** — algorithmic reputation from attestations

```bash
npm install @openconductor/openclaw-trust-stack
```

```typescript
import { TrustStack } from '@openconductor/openclaw-trust-stack';

// Wrap any OpenClaw agent with identity and compliance
const agent = TrustStack.wrap(myOpenClawAgent, {
  identity: { name: 'My Agent', owner: '0x...', category: 'productivity' },
  compliance: { euAiAct: true, riskLevel: 'limited' },
  monetization: { perAction: 0.01, currency: 'USD' }
});

// Agent now has verifiable identity, compliance metadata, and billing
await agent.register(); // On-chain ERC-8004 registration
```

---

## See the Difference

**Before** — custom API key checks, credit ledgers, Stripe webhook plumbing, and rate-limiting code in every MCP server you ship.

**After** — install the SDK, wrap a tool handler. Credits deduct from a hosted Postgres on every call; insufficient credits returns a typed JSON-RPC error your MCP client renders as an upgrade prompt.

```ts
import { requirePayment } from '@openconductor/mcp-sdk';

const analyze = requirePayment({ credits: 5 }, { toolName: 'analyze-data' })(
  async (input) => ({ summary: await summarize(input.text) })
);
```

- **Demo mode** (no API key): mocks 9999 credits, logs every check to console. Safe to ship in examples.
- **Production mode** (with API key): hits `https://api.openconductor.ai`, atomic deduct per call, idempotent via `callId`.
- **Credit packs**: starter 100 ($9.99), pro 500 ($39.99), business 2000 ($119.99). Stripe checkout, webhook grants credits on success.

---

## Quick Start

```bash
# Install the SDK to monetize an MCP server you're building
npm install @openconductor/mcp-sdk

# Try demo mode (no key needed)
npx @openconductor/mcp-sdk demo

# Or install the CLI to manage MCP servers in Claude Desktop / Cursor / Cline / Windsurf
npm install -g @openconductor/cli
openconductor stack install coder
```

---

## Stacks

Pre-configured workflows in one command. Each stack includes servers + a system prompt that turns Claude into a specialized assistant.

### Coder Stack

Build, debug, and deploy like a senior engineer.

```bash
openconductor stack install coder
```

### Writer Stack

Research, write, and publish with confidence.

```bash
openconductor stack install writer
```

### Essential Stack

Everything you need to get started.

```bash
openconductor stack install essential
```

[Browse all stacks ->](https://openconductor.ai/stacks)

---

## Commands

```bash
# Discovery
openconductor discover [query]      # Search 220+ servers

# Installation
openconductor install <server>      # Install a single server
openconductor stack install <name>  # Install a complete stack

# Management
openconductor list                  # Show installed servers
openconductor remove <server>       # Remove a server
openconductor update                # Update all servers
openconductor init                  # Initialize config
openconductor badge <server>        # Generate install badge
openconductor achievements          # View achievements
openconductor analytics             # Analytics preferences
```

---

## Works With

| Client         | Status          |
| -------------- | --------------- |
| Claude Desktop | Yes - Full support |
| Cursor         | Yes - Full support |
| Cline          | Yes - Full support |
| Windsurf       | Yes - Full support |
| Continue       | Planned |

---

## Why OpenConductor?

|                      |   Manual Config   |   OpenConductor    |
| -------------------- | :---------------: | :----------------: |
| Edit JSON files      | Required | No |
| Remember syntax      | Every time | Handled |
| Multi-client support | Configure each | Automatic |
| Monetization setup   | Build billing from scratch | One-line `requirePayment()` |
| Pre-built workflows  | DIY | Stacks |
| Time to install      |      ~5 min       |      ~10 sec       |

---

## 220+ Servers

The largest registry of MCP servers, all verified and tested.

| Category             | Examples                                       |
| -------------------- | ---------------------------------------------- |
| **Developer Tools**  | github, gitlab, postgres, redis, docker        |
| **Productivity**     | notion, slack, linear, todoist, google-drive   |
| **Memory & RAG**     | mcp-memory, mem0, knowledge-graph, qdrant      |
| **Web & Browser**    | puppeteer, playwright, firecrawl, brave-search |
| **AI & LLMs**        | openai, replicate, huggingface                 |
| **Data & Analytics** | bigquery, snowflake, dbt                       |

[Browse all servers ->](https://openconductor.ai/discover)

---

## Add Your Server

Submit a PR to add your server to the registry.

---

## Roadmap

- [x] CLI for MCP server installation
- [x] 220+ server registry
- [x] Multi-client support (Claude, Cursor, Cline)
- [x] Pre-configured Stacks with system prompts
- [x] ERC-8004 agent identity (on-chain, Base Sepolia)
- [x] Agent registration UI with wallet connect
- [x] Subgraph indexer (The Graph)
- [x] Stripe billing integration (subscriptions + credit packs)
- [x] OpenClaw Trust Stack integration package
- [x] `requirePayment()` monetization middleware in `@openconductor/mcp-sdk`
- [x] Hosted billing API at `api.openconductor.ai`
- [ ] `openconductor deploy --monetize` (CLI command currently a stub)
- [ ] Self-serve API key issuance (dashboard or CLI)
- [ ] `proxy.openconductor.ai` for rate-limit enforcement
- [ ] AP2 policy engine (governance)
- [ ] EU AI Act compliance tooling (August 2026 deadline)
- [ ] Base mainnet deployment
- [ ] Agent marketplace with trust scores
- [ ] Insurance API for agent operations

---

## Contributing

```bash
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor
npm install
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Community

- [Website](https://openconductor.ai)
- [Discord](https://discord.gg/openconductor)
- [Twitter/X](https://twitter.com/openconductor)
- [Issues](https://github.com/epicmotionSD/openconductor/issues)

---

## Resources

- [Awesome MCP](https://github.com/epicmotionSD/awesome-mcp) - Curated list of MCP servers, tools, and resources
- [MCP Specification](https://spec.modelcontextprotocol.io/) - Official Model Context Protocol docs
- [OpenConductor Guides](https://openconductor.ai/docs) - Tutorials and integration guides
- [MCP Quickstart](https://modelcontextprotocol.io/quickstart) - Get started quickly
- [Trust Stack](https://openconductor.ai/trust-stack) - Agent identity and compliance infrastructure
- [@openconductor/mcp-sdk](https://www.npmjs.com/package/@openconductor/mcp-sdk) - `requirePayment()` middleware + credit-pack checkout
- [api.openconductor.ai](https://api.openconductor.ai) - Hosted billing API
- [ERC-8004 Contract](https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a) - On-chain agent registry
- [Subgraph](https://thegraph.com/studio/subgraph/openconductor/) - Query agent data via GraphQL
---

## License

MIT (c) [OpenConductor](https://openconductor.ai)

---

<p align="center">
  <sub>The identity, compliance, and monetization layer for the agent economy.</sub>
</p>

