# OpenConductor ERC-8004 Subgraph

Indexes the ERC-8004 Agent Identity Registry on Base Sepolia (and mainnet).

## Setup

```bash
cd packages/subgraph
npm install
```

## Deploy to The Graph Studio

1. Create a subgraph at [The Graph Studio](https://thegraph.com/studio/)
2. Authenticate:
   ```bash
   graph auth --studio YOUR_DEPLOY_KEY
   ```
3. Generate code and deploy:
   ```bash
   npm run codegen
   npm run build
   npm run deploy:studio
   ```

## Endpoints

- **Base Sepolia**: https://api.studio.thegraph.com/query/YOUR_ID/openconductor-registry/version/latest

## Example Queries

### Get all registered agents
```graphql
{
  agents(first: 100, orderBy: registeredAt, orderDirection: desc) {
    id
    tokenId
    owner
    metadataURI
    trustScore
    verificationTier
    isActive
    registeredAt
    attestationCount
  }
}
```

### Get registry stats
```graphql
{
  registryStats(id: "stats") {
    totalAgents
    activeAgents
    totalAttestations
    lastUpdated
  }
}
```

### Get agent with attestations
```graphql
{
  agent(id: "1") {
    tokenId
    owner
    metadataURI
    trustScore
    verificationTier
    attestations {
      attestor
      attestorName
      attestationURI
      createdAt
    }
  }
}
```

## Contract

- **Base Sepolia**: `0xf8d7044d657b602194fb5745c614beb35d5d898a`
- **Explorer**: https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a
