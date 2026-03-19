/**
 * OpenClaw Trust Stack — ERC-8004 Contract Interface
 *
 * ABI and address for the ERC-8004 Agent Identity Registry
 * deployed on Base Sepolia (testnet) and Base (mainnet, coming Q2 2026).
 */

export const ERC8004_ADDRESS = {
  baseSepolia: '0xf8d7044d657b602194fb5745c614beb35d5d898a' as const,
  base: '' as const, // Mainnet deployment Q2 2026
} as const;

export const ERC8004_ABI = [
  {
    type: 'function',
    name: 'registerAgent',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'registrant', type: 'address' },
          { name: 'metadataURI', type: 'string' },
          { name: 'tier', type: 'uint8' },
          { name: 'trustScore', type: 'uint8' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'lastUpdated', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addAttestation',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'attestationType', type: 'string' },
      { name: 'evidence', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateTrustScore',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newScore', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'upgradeTier',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newTier', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateMetadata',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newMetadataURI', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAttestations',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'verifier', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'attestationType', type: 'string' },
          { name: 'evidence', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalAgents',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deactivateAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'reactivateAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'registrant', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AttestationAdded',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'verifier', type: 'address', indexed: true },
      { name: 'attestationType', type: 'string', indexed: false },
      { name: 'evidence', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TrustScoreUpdated',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'oldScore', type: 'uint8', indexed: false },
      { name: 'newScore', type: 'uint8', indexed: false },
      { name: 'updater', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TierUpgraded',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'oldTier', type: 'uint8', indexed: false },
      { name: 'newTier', type: 'uint8', indexed: false },
      { name: 'verifier', type: 'address', indexed: true },
    ],
  },
] as const;
