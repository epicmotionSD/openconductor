/**
 * Feature configuration for OpenConductor
 * Controls which features are available in different phases
 */

export interface FeatureConfig {
  // Core Registry Features (Phase 1 - Public)
  serverDiscovery: boolean;
  serverSearch: boolean;
  serverDetails: boolean;
  cliInstallation: boolean;
  basicStats: boolean;
  categories: boolean;
  
  // Advanced Enterprise Features (Phase 2 - Admin Only)
  githubWebhooks: boolean;
  backgroundJobs: boolean;
  advancedAnalytics: boolean;
  rateLimitingDashboard: boolean;
  userManagement: boolean;
  serverSubmission: boolean;
  adminControls: boolean;
  webhookStatus: boolean;
  apiKeyManagement: boolean;
  
  // Development Features (Dev Only)
  testEndpoints: boolean;
  debugRoutes: boolean;
  metricsDashboard: boolean;
}

const PHASE_1_CONFIG: FeatureConfig = {
  // Phase 1 - Public Features
  serverDiscovery: true,
  serverSearch: true, 
  serverDetails: true,
  cliInstallation: true,
  basicStats: true,
  categories: true,
  
  // Phase 2 - Hidden from public
  githubWebhooks: false,
  backgroundJobs: false,
  advancedAnalytics: false,
  rateLimitingDashboard: false,
  userManagement: false,
  serverSubmission: false,
  adminControls: false,
  webhookStatus: false,
  apiKeyManagement: false,
  
  // Development only
  testEndpoints: false,
  debugRoutes: false,
  metricsDashboard: false
};

const PHASE_2_CONFIG: FeatureConfig = {
  // All features enabled
  serverDiscovery: true,
  serverSearch: true,
  serverDetails: true,
  cliInstallation: true,
  basicStats: true,
  categories: true,
  githubWebhooks: true,
  backgroundJobs: true,
  advancedAnalytics: true,
  rateLimitingDashboard: true,
  userManagement: true,
  serverSubmission: true,
  adminControls: true,
  webhookStatus: true,
  apiKeyManagement: true,
  testEndpoints: false,
  debugRoutes: false,
  metricsDashboard: false
};

const DEV_CONFIG: FeatureConfig = {
  // All features enabled including dev tools
  ...PHASE_2_CONFIG,
  testEndpoints: true,
  debugRoutes: true,
  metricsDashboard: true
};

/**
 * Get current feature configuration based on environment
 */
export function getFeatureConfig(): FeatureConfig {
  const phase = process.env.OPENCONDUCTOR_PHASE || 'phase1';
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'development') {
    return DEV_CONFIG;
  } else if (phase === 'phase2') {
    return PHASE_2_CONFIG;
  } else {
    return PHASE_1_CONFIG;
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureConfig): boolean {
  const config = getFeatureConfig();
  return config[feature];
}

/**
 * Middleware to check if a feature is enabled for the request
 */
export function requireFeature(feature: keyof FeatureConfig) {
  return (req: any, res: any, next: any) => {
    if (!isFeatureEnabled(feature)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: 'This feature is not available in the current phase'
        }
      });
    }
    next();
  };
}

/**
 * Get public-facing feature list for Phase 1
 */
export function getPublicFeatures(): {
  available: string[];
  comingSoon: string[];
} {
  return {
    available: [
      'MCP Server Discovery',
      'Advanced Search & Filtering', 
      'One-Command CLI Installation',
      'Cross-Platform Configuration Management',
      'Server Statistics & Trending',
      'Category Browsing',
      'Interactive CLI Experience'
    ],
    comingSoon: [
      'GitHub Integration & Auto-Sync',
      'Advanced Analytics Dashboard',
      'Server Submission Workflow',
      'Community Reviews & Ratings',
      'API Key Management',
      'Enterprise Monitoring'
    ]
  };
}

export const features = getFeatureConfig();