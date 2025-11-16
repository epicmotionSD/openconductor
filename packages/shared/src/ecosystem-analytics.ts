// OpenConductor Ecosystem Analytics Types
// Cross-product tracking for OpenConductor, FlexaBrain, FlexaSports, and X3O

export type EcosystemProduct =
  | 'openconductor'
  | 'flexabrain'
  | 'x3o'
  | 'flexasports'
  | 'sportintel';

export type EcosystemEventType =
  | 'install'
  | 'discovery'
  | 'usage'
  | 'conversion'
  | 'ecosystem_referral';

export interface EcosystemEvent {
  event_id: string;
  timestamp: Date;
  product: EcosystemProduct;
  event_type: EcosystemEventType;
  user_hash: string;  // Anonymous SHA-256 hash of machine ID
  session_id: string;
  metadata: {
    server_slug?: string;      // For OpenConductor installs
    source?: string;            // Where they came from
    destination?: string;       // Where they're going
    referrer?: string;          // How they found the product
    platform?: 'darwin' | 'linux' | 'win32';
    cli_version?: string;
    node_version?: string;
    installation_method?: 'cli' | 'npm' | 'docker' | 'manual';
    success?: boolean;
    query?: string;             // Search query for discovery events
    results_count?: number;     // Number of results for discovery
    [key: string]: any;         // Additional metadata
  };
}

export interface CrossProductJourney {
  journey_id: string;
  user_hash: string;
  touchpoints: {
    product: EcosystemProduct;
    timestamp: Date;
    action: string;
  }[];
  conversion_path: EcosystemProduct[];
  lifetime_value_signals: number;
}

export interface UserJourney {
  id: string;
  user_hash: string;
  first_touchpoint: EcosystemProduct;
  last_touchpoint: EcosystemProduct;
  products_discovered: EcosystemProduct[];
  conversion_path: EcosystemProduct[];
  total_interactions: number;
  first_seen_at: Date;
  last_seen_at: Date;
}

export interface InstallVelocityMetric {
  product: EcosystemProduct;
  date: string;
  hour: number;
  install_count: number;
  unique_users: number;
  growth_rate?: number;
  hourly_growth?: number;
  growth_percentage?: number;
}

export interface DiscoveryMatrixEntry {
  source_product: EcosystemProduct;
  destination_product: EcosystemProduct;
  discovery_count: number;
  conversion_count: number;
  conversion_rate: number;
  last_updated: Date;
}

export interface EcosystemAnalyticsSummary {
  product: EcosystemProduct;
  total_users: number;
  total_events: number;
  total_installs: number;
  total_discoveries: number;
  total_referrals: number;
  last_event_at: Date;
}

export interface VelocityResponse {
  success: boolean;
  data: {
    current_hour: InstallVelocityMetric;
    growth_rate: number;
    trending: 'up' | 'down' | 'stable';
    history: InstallVelocityMetric[];
  };
}

export interface FunnelResponse {
  success: boolean;
  data: {
    funnel: DiscoveryMatrixEntry[];
    insights: {
      total_discoveries: number;
      avg_conversion_rate: string;
      top_path: DiscoveryMatrixEntry | null;
    };
  };
}

export interface JourneyPatternsResponse {
  success: boolean;
  data: {
    patterns: {
      conversion_path: EcosystemProduct[];
      frequency: number;
      avg_interactions: number;
      avg_journey_hours: number;
    }[];
    most_common_path: EcosystemProduct[];
  };
}

export interface BatchEventsRequest {
  events: EcosystemEvent[];
}

export interface BatchEventsResponse {
  success: boolean;
  synced: number;
  error?: string;
}

// Ecosystem suggestions for cross-product discovery
export interface EcosystemSuggestion {
  product: string;
  reason: string;
  url: string;
  cta: string;
  keywords: string[];
}

export const ECOSYSTEM_SUGGESTIONS: Record<string, EcosystemSuggestion> = {
  'flexabrain': {
    product: 'FlexaBrain',
    reason: 'Advanced multi-agent memory orchestration with enterprise features',
    url: 'https://flexabrain.ai',
    cta: 'Learn more about FlexaBrain →',
    keywords: ['memory', 'agent', 'orchestration', 'multi-agent', 'rag', 'semantic']
  },
  'flexasports': {
    product: 'FlexaSports',
    reason: 'AI-powered DFS analytics with explainable predictions',
    url: 'https://flexasports.ai',
    cta: 'Discover FlexaSports →',
    keywords: ['sports', 'dfs', 'analytics', 'betting', 'nfl', 'nba', 'mlb', 'nhl', 'predictions']
  },
  'x3o': {
    product: 'X3O Trinity Dashboard',
    reason: 'Bloomberg Terminal for AI agent orchestration',
    url: 'https://x3o.ai',
    cta: 'See X3O Trinity Dashboard →',
    keywords: ['dashboard', 'monitoring', 'orchestration', 'enterprise', 'bloomberg', 'terminal']
  }
};

// Helper function to match search query to ecosystem products
export function matchQueryToSuggestions(query?: string): EcosystemSuggestion[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  const matches: EcosystemSuggestion[] = [];

  for (const suggestion of Object.values(ECOSYSTEM_SUGGESTIONS)) {
    for (const keyword of suggestion.keywords) {
      if (lowerQuery.includes(keyword)) {
        matches.push(suggestion);
        break;
      }
    }
  }

  return matches;
}

// Analytics tracking configuration
export interface AnalyticsConfig {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
  offlineQueuePath?: string;
  enabled: boolean;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  apiUrl: process.env.OPENCONDUCTOR_API_URL || 'https://api.openconductor.ai',
  timeout: 2000,  // 2 seconds - don't slow down CLI
  maxRetries: 3,
  enabled: true
};
