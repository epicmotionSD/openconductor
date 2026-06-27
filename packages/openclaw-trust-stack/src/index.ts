/**
 * @openconductor/openclaw-trust-stack
 *
 * Identity, Compliance & Monetization layer for OpenClaw agents.
 * On-chain registration via ERC-8004 on Base.
 */

export { TrustStack, TrustStackAgent } from './trust-stack.js';
export type { NetworkName } from './trust-stack.js';

export { ERC8004_ABI, ERC8004_ADDRESS } from './contract.js';

export {
  VerificationTier,
  type EuAiActRiskLevel,
  type AgentIdentity,
  type ComplianceConfig,
  type MonetizationConfig,
  type TrustStackConfig,
  type OnChainAgent,
  type Attestation,
  type RegistrationResult,
  type AuditEntry,
} from './types.js';
