# @openconductor/openclaw-trust-stack

> Identity, Compliance & Monetization layer for OpenClaw agents — powered by ERC-8004 on Base.

Every AI agent needs an identity. This SDK wraps any [OpenClaw](https://openclaw.ai) agent with on-chain registration, EU AI Act compliance metadata, audit trails, and monetization middleware.

## Install

```bash
npm install @openconductor/openclaw-trust-stack
```

## Quick Start

```typescript
import { TrustStack } from '@openconductor/openclaw-trust-stack';

// 1. Wrap your OpenClaw agent
const agent = TrustStack.wrap(myOpenClawAgent, {
  identity: {
    name: 'My Agent',
    owner: '0xYourAddress',
    category: 'productivity',
    description: 'An agent that does useful things',
  },
  compliance: {
    euAiAct: true,
    riskLevel: 'limited',
    dataJurisdictions: ['EU', 'US'],
  },
  monetization: {
    perAction: 0.01,
    currency: 'USD',
  },
});

// 2. Register on-chain (requires a viem WalletClient)
const result = await agent.register(walletClient);
console.log(`Registered! Agent #${result.agentId}`);
console.log(`Explorer: ${result.explorerUrl}`);

// 3. Log actions for audit trail
agent.logAction('summarize', { docId: '123' }, { summary: '...' }, 450);

// 4. Check compliance status
const summary = agent.getComplianceSummary();
```

## Features

| Layer | What it does |
|-------|-------------|
| **Identity** | On-chain ERC-8004 registration with metadata URI |
| **Compliance** | EU AI Act risk classification, ISO 42001 flags, data jurisdiction tracking |
| **Monetization** | Per-action pricing, usage metering hooks, Stripe integration ready |
| **Audit** | In-memory action logging with compliance context, exportable audit trail |

## API

### `TrustStack.wrap(agent, config, options?)`

Wraps an agent with Trust Stack capabilities. Returns a `TrustStackAgent`.

- `agent` — Your OpenClaw agent object
- `config.identity` — Agent name, owner address, category
- `config.compliance` — EU AI Act risk level, ISO 42001, jurisdictions (optional)
- `config.monetization` — Per-action pricing, currency, Stripe key (optional)
- `options.network` — `'baseSepolia'` (default) or `'base'`

### `TrustStack.lookup(agentId, options?)`

Look up any agent's on-chain record by ID.

### `TrustStack.totalAgents(options?)`

Get the total number of registered agents on-chain.

### `TrustStackAgent` instance methods

| Method | Description |
|--------|-------------|
| `register(walletClient)` | Register on-chain via ERC-8004. Returns `{ agentId, transactionHash, explorerUrl }` |
| `getOnChainRecord(agentId?)` | Fetch the on-chain agent record |
| `getAttestations(agentId?)` | Fetch all attestations for the agent |
| `logAction(action, input, output, durationMs)` | Log an action to the audit trail |
| `exportAuditLog()` | Export all logged audit entries |
| `getComplianceSummary()` | Get a full compliance + monetization summary |
| `shouldCharge()` | Check if monetization is configured |

## ERC-8004

This SDK interacts with the OpenConductor Agent Identity contract (ERC-8004) deployed on:

- **Base Sepolia (testnet):** `0xf8d7044d657b602194fb5745c614beb35d5d898a`
- **Base (mainnet):** Coming Q2 2026

## Related

- [OpenConductor](https://github.com/OpenConductor/openconductor) — The MCP server registry
- [ERC-8004 Specification](https://openconductor.dev/trust-stack) — Agent identity standard
- [OpenClaw](https://openclaw.ai) — Open-source agent OS

## License

MIT — see [LICENSE](../../LICENSE) for details.
