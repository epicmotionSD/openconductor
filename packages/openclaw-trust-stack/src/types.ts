/**
 * OpenClaw Trust Stack — Type Definitions
 *
 * Core types for agent identity, compliance metadata,
 * monetization config, and Trust Stack operations.
 */

/** EU AI Act risk classification levels */
export type EuAiActRiskLevel = 'minimal' | 'limited' | 'high' | 'unacceptable';

/** ERC-8004 verification tiers */
export enum VerificationTier {
  Unverified = 0,
  Basic = 1,
  Standard = 2,
  Advanced = 3,
  Enterprise = 4,
}

/** Agent identity configuration for on-chain registration */
export interface AgentIdentity {
  /** Human-readable agent name */
  name: string;
  /** Ethereum address of the agent owner */
  owner: `0x${string}`;
  /** Agent category for registry classification */
  category: string;
  /** Source repository URL (e.g., GitHub) */
  sourceUrl?: string;
  /** Agent description */
  description?: string;
  /** Maintainer contact email */
  maintainerEmail?: string;
}

/** EU AI Act compliance metadata */
export interface ComplianceConfig {
  /** Whether EU AI Act compliance metadata should be attached */
  euAiAct: boolean;
  /** Risk level classification per EU AI Act Article 6 */
  riskLevel: EuAiActRiskLevel;
  /** ISO 42001 AI management system compliance */
  iso42001?: boolean;
  /** Human oversight contact for high-risk systems */
  humanOversightContact?: string;
  /** Data processing jurisdiction(s) */
  dataJurisdictions?: string[];
}

/** Monetization configuration for agent actions */
export interface MonetizationConfig {
  /** Price per agent action in the specified currency */
  perAction: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Stripe price ID for subscription billing (optional) */
  stripePriceId?: string;
  /** Whether to meter usage for post-hoc billing */
  meterUsage?: boolean;
}

/** Full Trust Stack configuration for wrapping an agent */
export interface TrustStackConfig {
  identity: AgentIdentity;
  compliance?: ComplianceConfig;
  monetization?: MonetizationConfig;
}

/** On-chain agent record as returned from ERC-8004 */
export interface OnChainAgent {
  id: bigint;
  registrant: `0x${string}`;
  metadataURI: string;
  tier: VerificationTier;
  trustScore: number;
  registeredAt: bigint;
  lastUpdated: bigint;
  active: boolean;
}

/** Attestation record */
export interface Attestation {
  verifier: `0x${string}`;
  timestamp: bigint;
  attestationType: string;
  evidence: string;
}

/** Result of a Trust Stack registration */
export interface RegistrationResult {
  agentId: bigint;
  transactionHash: `0x${string}`;
  metadataURI: string;
  explorerUrl: string;
}

/** Audit log entry for agent actions */
export interface AuditEntry {
  agentId: bigint;
  action: string;
  timestamp: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  compliance: {
    riskLevel: EuAiActRiskLevel;
    jurisdictions: string[];
  };
}
