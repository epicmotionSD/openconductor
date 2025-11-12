/**
 * Production environment configuration for OpenConductor launch
 */

export interface ProductionConfig {
  // Database
  database: {
    url: string;
    ssl: boolean;
    maxConnections: number;
  };
  
  // API Configuration
  api: {
    port: number;
    corsOrigins: string[];
    rateLimitEnabled: boolean;
    analyticsEnabled: boolean;
  };
  
  // Launch Settings
  launch: {
    phase: 'phase1' | 'phase2';
    featuresEnabled: string[];
    maxServers: number;
    publicRegistryEnabled: boolean;
  };
  
  // Monitoring
  monitoring: {
    healthCheckEnabled: boolean;
    metricsEnabled: boolean;
    alertingEnabled: boolean;
  };
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  database: {
    url: process.env.POSTGRES_URL || 'postgres://localhost:5432/openconductor',
    ssl: true,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
  },
  
  api: {
    port: parseInt(process.env.PORT || '3001'),
    corsOrigins: [
      'https://openconductor.ai',
      'https://www.openconductor.ai',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    ],
    rateLimitEnabled: true,
    analyticsEnabled: true
  },
  
  launch: {
    phase: (process.env.OPENCONDUCTOR_PHASE as any) || 'phase1',
    featuresEnabled: [
      'serverDiscovery',
      'serverSearch', 
      'serverDetails',
      'cliInstallation',
      'basicStats',
      'categories'
    ],
    maxServers: 1000, // Limit for Phase 1 launch
    publicRegistryEnabled: true
  },
  
  monitoring: {
    healthCheckEnabled: true,
    metricsEnabled: true,
    alertingEnabled: process.env.NODE_ENV === 'production'
  }
};

/**
 * Environment-specific overrides
 */
export function getConfig(): ProductionConfig {
  const baseConfig = { ...PRODUCTION_CONFIG };
  
  // Development overrides
  if (process.env.NODE_ENV === 'development') {
    baseConfig.database.ssl = false;
    // Parse CORS_ORIGIN environment variable (comma-separated list)
    const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'];
    baseConfig.api.corsOrigins = [
      ...baseConfig.api.corsOrigins,
      ...corsOrigins
    ];
    baseConfig.launch.maxServers = 100; // Lower limit for dev
    baseConfig.monitoring.alertingEnabled = false;
  }
  
  // Phase 2 feature additions
  if (baseConfig.launch.phase === 'phase2') {
    baseConfig.launch.featuresEnabled.push(
      'githubWebhooks',
      'backgroundJobs',
      'advancedAnalytics',
      'adminControls',
      'serverSubmission'
    );
  }
  
  return baseConfig;
}

/**
 * Launch readiness checker
 */
export function checkLaunchReadiness(): {
  ready: boolean;
  issues: string[];
  checklist: Record<string, boolean>;
} {
  const issues: string[] = [];
  const checklist = {
    databaseConnected: !!process.env.POSTGRES_URL,
    corsConfigured: true,
    rateLimitingEnabled: true,
    errorHandlingConfigured: true,
    healthChecksEnabled: true
  };
  
  // Check critical launch requirements
  if (!process.env.POSTGRES_URL) {
    issues.push('POSTGRES_URL environment variable not set');
    checklist.databaseConnected = false;
  }
  
  if (!process.env.NODE_ENV) {
    issues.push('NODE_ENV should be set to "production"');
  }
  
  // Check feature configuration
  const config = getConfig();
  if (!config.launch.publicRegistryEnabled) {
    issues.push('Public registry not enabled');
  }
  
  if (!config.monitoring.healthCheckEnabled) {
    issues.push('Health checks not enabled');
    checklist.healthChecksEnabled = false;
  }
  
  return {
    ready: issues.length === 0,
    issues,
    checklist
  };
}

/**
 * Launch metrics tracking configuration
 */
export const LAUNCH_METRICS = {
  // Key metrics to track during launch week
  kpis: [
    'total_cli_installs',
    'unique_visitors',
    'github_stars', 
    'discord_members',
    'server_discovery_sessions',
    'successful_installs',
    'error_rate'
  ],
  
  // Success thresholds for launch week
  targets: {
    day1: {
      cliInstalls: 50,
      githubStars: 100,
      siteVisitors: 500,
      discordMembers: 20
    },
    week1: {
      cliInstalls: 500,
      githubStars: 200,
      siteVisitors: 2000,
      discordMembers: 50
    }
  },
  
  // Critical failure thresholds
  alerts: {
    errorRate: 5, // Alert if >5% error rate
    responseTime: 2000, // Alert if >2s average response time
    downtime: 60 // Alert if down >1 minute
  }
};

/**
 * Generate launch environment variables
 */
export function generateLaunchEnvVars(): Record<string, string> {
  return {
    NODE_ENV: 'production',
    OPENCONDUCTOR_PHASE: 'phase1',
    PORT: '3001',
    CORS_ORIGIN: 'https://openconductor.ai',
    
    // Feature flags for Phase 1
    ENABLE_SERVER_SUBMISSION: 'false',
    ENABLE_ADMIN_ROUTES: 'false', 
    ENABLE_GITHUB_WEBHOOKS: 'false',
    
    // Launch-specific settings
    LAUNCH_MODE: 'true',
    MAX_SERVERS_DISPLAYED: '127',
    RATE_LIMIT_ENABLED: 'true',
    ANALYTICS_ENABLED: 'true',
    
    // Monitoring
    HEALTH_CHECKS_ENABLED: 'true',
    METRICS_ENABLED: 'true',
    ERROR_TRACKING_ENABLED: 'true'
  };
}

export const config = getConfig();