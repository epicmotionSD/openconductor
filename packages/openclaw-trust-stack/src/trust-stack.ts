/**
 * OpenClaw Trust Stack — Core SDK
 *
 * Wraps any OpenClaw agent with ERC-8004 identity, compliance metadata,
 * audit trails, and monetization middleware.
 *
 * Usage:
 *   import { TrustStack } from '@openconductor/openclaw-trust-stack';
 *
 *   const wrapped = TrustStack.wrap(agent, {
 *     identity: { name: 'My Agent', owner: '0x...', category: 'productivity' },
 *     compliance: { euAiAct: true, riskLevel: 'limited' },
 *     monetization: { perAction: 0.01, currency: 'USD' }
 *   });
 *
 *   await wrapped.register();
 */

import { createPublicClient, http, type Chain, type WalletClient, type Transport, type Account } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { ERC8004_ABI, ERC8004_ADDRESS } from './contract.js';
import type {
  TrustStackConfig,
  OnChainAgent,
  Attestation,
  RegistrationResult,
  AuditEntry,
} from './types.js';
import { VerificationTier } from './types.js';

export type NetworkName = 'baseSepolia' | 'base';

interface TrustStackOptions {
  network?: NetworkName;
  rpcUrl?: string;
}

const CHAINS: Record<NetworkName, Chain> = {
  baseSepolia,
  base,
};

const EXPLORER_URLS: Record<NetworkName, string> = {
  baseSepolia: 'https://sepolia.basescan.org',
  base: 'https://basescan.org',
};

/**
 * TrustStackAgent — an OpenClaw agent wrapped with identity, compliance, and monetization.
 */
export class TrustStackAgent {
  readonly config: TrustStackConfig;
  private readonly network: NetworkName;
  private readonly chain: Chain;
  private readonly contractAddress: `0x${string}`;
  private agentId: bigint | null = null;
  private auditLog: AuditEntry[] = [];

  constructor(
    /** The underlying OpenClaw agent object */
    public readonly agent: unknown,
    config: TrustStackConfig,
    options: TrustStackOptions = {}
  ) {
    this.config = config;
    this.network = options.network ?? 'baseSepolia';
    this.chain = CHAINS[this.network];
    this.contractAddress = ERC8004_ADDRESS[this.network] as `0x${string}`;

    if (!this.contractAddress) {
      throw new Error(
        `ERC-8004 contract not deployed on ${this.network}. Use 'baseSepolia' for testnet.`
      );
    }
  }

  /** Encode agent metadata as a base64 data URI (matching the registration UI format) */
  private encodeMetadataURI(): string {
    const metadata = {
      name: this.config.identity.name,
      owner: this.config.identity.owner,
      category: this.config.identity.category,
      sourceUrl: this.config.identity.sourceUrl,
      description: this.config.identity.description,
      maintainerEmail: this.config.identity.maintainerEmail,
      compliance: this.config.compliance
        ? {
            euAiAct: this.config.compliance.euAiAct,
            riskLevel: this.config.compliance.riskLevel,
            iso42001: this.config.compliance.iso42001,
            dataJurisdictions: this.config.compliance.dataJurisdictions,
          }
        : undefined,
      registeredAt: new Date().toISOString(),
      sdk: '@openconductor/openclaw-trust-stack',
      version: '0.1.0',
    };

    const json = JSON.stringify(metadata);
    const encoded = Buffer.from(json).toString('base64');
    return `data:application/json;base64,${encoded}`;
  }

  /** Create a read-only client for querying the contract */
  private getPublicClient() {
    return createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }

  /**
   * Register this agent on-chain via ERC-8004.
   *
   * Requires a wallet client (e.g., from a browser wallet or private key).
   * Returns the registration result with agentId and transaction hash.
   */
  async register(walletClient?: WalletClient<Transport, Chain, Account>): Promise<RegistrationResult> {
    if (!walletClient) {
      throw new Error(
        'A wallet client is required to register on-chain. ' +
          'Pass a viem WalletClient with an account.'
      );
    }

    const metadataURI = this.encodeMetadataURI();

    const hash = await walletClient.writeContract({
      address: this.contractAddress,
      abi: ERC8004_ABI,
      functionName: 'registerAgent',
      args: [metadataURI],
      account: walletClient.account,
      chain: this.chain,
    });

    // Wait for transaction receipt to get the agentId from logs
    const publicClient = this.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parse AgentRegistered event to extract agentId
    const registrationLog = receipt.logs[0];
    if (registrationLog?.topics[1]) {
      this.agentId = BigInt(registrationLog.topics[1]);
    }

    return {
      agentId: this.agentId ?? 0n,
      transactionHash: hash,
      metadataURI,
      explorerUrl: `${EXPLORER_URLS[this.network]}/tx/${hash}`,
    };
  }

  /**
   * Look up this agent's on-chain record by agentId.
   */
  async getOnChainRecord(agentId?: bigint): Promise<OnChainAgent> {
    const id = agentId ?? this.agentId;
    if (id === null) {
      throw new Error('No agentId known. Register first or provide an agentId.');
    }

    const publicClient = this.getPublicClient();
    const result = await publicClient.readContract({
      address: this.contractAddress,
      abi: ERC8004_ABI,
      functionName: 'getAgent',
      args: [id],
    });

    const agent = result as {
      id: bigint;
      registrant: `0x${string}`;
      metadataURI: string;
      tier: number;
      trustScore: number;
      registeredAt: bigint;
      lastUpdated: bigint;
      active: boolean;
    };

    return {
      id: agent.id,
      registrant: agent.registrant,
      metadataURI: agent.metadataURI,
      tier: agent.tier as VerificationTier,
      trustScore: agent.trustScore,
      registeredAt: agent.registeredAt,
      lastUpdated: agent.lastUpdated,
      active: agent.active,
    };
  }

  /**
   * Get all attestations for this agent.
   */
  async getAttestations(agentId?: bigint): Promise<Attestation[]> {
    const id = agentId ?? this.agentId;
    if (id === null) {
      throw new Error('No agentId known. Register first or provide an agentId.');
    }

    const publicClient = this.getPublicClient();
    const result = await publicClient.readContract({
      address: this.contractAddress,
      abi: ERC8004_ABI,
      functionName: 'getAttestations',
      args: [id],
    });

    return (result as Attestation[]).map((a) => ({
      verifier: a.verifier,
      timestamp: a.timestamp,
      attestationType: a.attestationType,
      evidence: a.evidence,
    }));
  }

  /**
   * Log an agent action for audit trail purposes.
   * Entries are stored in-memory; use exportAuditLog() to persist.
   */
  logAction(
    action: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    durationMs: number
  ): AuditEntry {
    const entry: AuditEntry = {
      agentId: this.agentId ?? 0n,
      action,
      timestamp: Date.now(),
      input,
      output,
      durationMs,
      compliance: {
        riskLevel: this.config.compliance?.riskLevel ?? 'minimal',
        jurisdictions: this.config.compliance?.dataJurisdictions ?? [],
      },
    };
    this.auditLog.push(entry);
    return entry;
  }

  /** Export the in-memory audit log. */
  exportAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  /** Get the EU AI Act compliance summary for this agent. */
  getComplianceSummary() {
    return {
      agentId: this.agentId,
      name: this.config.identity.name,
      owner: this.config.identity.owner,
      euAiAct: {
        compliant: this.config.compliance?.euAiAct ?? false,
        riskLevel: this.config.compliance?.riskLevel ?? 'minimal',
        iso42001: this.config.compliance?.iso42001 ?? false,
        humanOversight: this.config.compliance?.humanOversightContact ?? null,
        dataJurisdictions: this.config.compliance?.dataJurisdictions ?? [],
      },
      monetization: this.config.monetization
        ? {
            perAction: this.config.monetization.perAction,
            currency: this.config.monetization.currency,
            metered: this.config.monetization.meterUsage ?? false,
          }
        : null,
      auditEntries: this.auditLog.length,
      registeredOnChain: this.agentId !== null,
      network: this.network,
    };
  }

  /** Check if monetization is configured and an action should be billed */
  shouldCharge(): boolean {
    return (
      this.config.monetization !== undefined && this.config.monetization.perAction > 0
    );
  }

  /** Get the current agentId (null if not yet registered) */
  getAgentId(): bigint | null {
    return this.agentId;
  }

  /** Manually set agentId for agents already registered on-chain */
  setAgentId(id: bigint): void {
    this.agentId = id;
  }
}

/**
 * TrustStack — Static factory for wrapping OpenClaw agents.
 */
export class TrustStack {
  /**
   * Wrap any OpenClaw agent with Trust Stack identity, compliance, and monetization.
   *
   * @param agent - The OpenClaw agent object to wrap
   * @param config - Trust Stack configuration (identity, compliance, monetization)
   * @param options - Network and RPC options
   * @returns A TrustStackAgent with registration, compliance, and audit capabilities
   */
  static wrap(
    agent: unknown,
    config: TrustStackConfig,
    options?: TrustStackOptions
  ): TrustStackAgent {
    return new TrustStackAgent(agent, config, options);
  }

  /**
   * Look up an agent's on-chain identity by agentId.
   */
  static async lookup(
    agentId: bigint,
    options?: TrustStackOptions
  ): Promise<OnChainAgent> {
    const dummy = new TrustStackAgent(
      null,
      { identity: { name: '', owner: '0x0000000000000000000000000000000000000000', category: '' } },
      options
    );
    return dummy.getOnChainRecord(agentId);
  }

  /**
   * Get the total number of registered agents on-chain.
   */
  static async totalAgents(options?: TrustStackOptions): Promise<bigint> {
    const network = options?.network ?? 'baseSepolia';
    const chain = CHAINS[network];
    const contractAddress = ERC8004_ADDRESS[network] as `0x${string}`;

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const result = await client.readContract({
      address: contractAddress,
      abi: ERC8004_ABI,
      functionName: 'totalAgents',
    });

    return result as bigint;
  }
}
