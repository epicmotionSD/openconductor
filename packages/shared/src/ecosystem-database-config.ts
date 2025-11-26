/**
 * Ecosystem Database Configuration
 * Shared configuration for tracking across all Sonnier Ventures products
 */

// Ecosystem products enumeration
export enum EcosystemProduct {
  OPENCONDUCTOR = 'openconductor',
  FLEXABRAIN = 'flexabrain',
  FLEXASPORTS = 'flexasports',
  SPORTINTEL = 'sportintel',
  X3O_TRINITY = 'x3o_trinity'
}

// User journey stages
export enum UserJourneyStage {
  DISCOVERY = 'discovery',
  INSTALLATION = 'installation',
  ACTIVATION = 'activation',
  ENGAGEMENT = 'engagement',
  RETENTION = 'retention',
  EXPANSION = 'expansion'
}

// Event types for ecosystem tracking
export enum EcosystemEventType {
  SERVER_DISCOVERED = 'server_discovered',
  SERVER_INSTALLED = 'server_installed',
  CLI_COMMAND_RUN = 'cli_command_run',
  API_REQUEST = 'api_request',
  AGENT_CREATED = 'agent_created',
  AGENT_EXECUTED = 'agent_executed',
  ORACLE_PREDICTION = 'oracle_prediction',
  SENTINEL_ALERT = 'sentinel_alert',
  SAGE_ANALYSIS = 'sage_analysis',
  DFS_LINEUP_CREATED = 'dfs_lineup_created',
  PLAYER_ANALYZED = 'player_analyzed',
  CONTEST_ENTERED = 'contest_entered',
  PRODUCT_DISCOVERED = 'product_discovered',
  CROSS_PRODUCT_NAVIGATION = 'cross_product_navigation',
  ECOSYSTEM_SIGNUP = 'ecosystem_signup'
}

export interface EcosystemDatabaseConfig {
  primaryUrl: string;
  readReplicaUrl?: string;
  analyticsUrl?: string;
  cacheUrl?: string;
  poolSize: number;
  connectionTimeout: number;
  ssl: boolean;
}

export const defaultEcosystemDbConfig: EcosystemDatabaseConfig = {
  primaryUrl: process.env.ECOSYSTEM_DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
  readReplicaUrl: process.env.ECOSYSTEM_READ_REPLICA_URL,
  analyticsUrl: process.env.ECOSYSTEM_ANALYTICS_URL,
  cacheUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  poolSize: 20,
  connectionTimeout: 5000,
  ssl: process.env.NODE_ENV === 'production'
};
