export type EcosystemProduct = 'openconductor' | 'flexabrain' | 'x3o' | 'flexasports' | 'sportintel';
export type EcosystemEventType = 'install' | 'discovery' | 'usage' | 'conversion' | 'ecosystem_referral';
export interface EcosystemEvent {
    event_id: string;
    timestamp: Date;
    product: EcosystemProduct;
    event_type: EcosystemEventType;
    user_hash: string;
    session_id: string;
    metadata: {
        server_slug?: string;
        source?: string;
        destination?: string;
        referrer?: string;
        platform?: 'darwin' | 'linux' | 'win32';
        cli_version?: string;
        node_version?: string;
        installation_method?: 'cli' | 'npm' | 'docker' | 'manual';
        success?: boolean;
        query?: string;
        results_count?: number;
        [key: string]: any;
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
export interface EcosystemSuggestion {
    product: string;
    reason: string;
    url: string;
    cta: string;
    keywords: string[];
}
export declare const ECOSYSTEM_SUGGESTIONS: Record<string, EcosystemSuggestion>;
export declare function matchQueryToSuggestions(query?: string): EcosystemSuggestion[];
export interface AnalyticsConfig {
    apiUrl: string;
    timeout: number;
    maxRetries: number;
    offlineQueuePath?: string;
    enabled: boolean;
}
export declare const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig;
