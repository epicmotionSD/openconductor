/**
 * OpenConductor MCP Integration - Complete Export
 * 
 * Complete MCP server registry integration for OpenConductor.
 * Transforms OpenConductor into "The npm for MCP Servers" platform.
 * 
 * NEW: Explainable AI, Professional Onboarding, and Bloomberg Terminal-style interfaces
 */

// Core MCP modules
export { MCPServerRegistry, createMCPServerRegistry } from './server-registry';
export { MCPSemanticSearchEngine, OpenAIEmbeddingProvider, createSemanticSearchEngine } from './semantic-search-engine';
export { MCPBillingSystem, SUBSCRIPTION_PLANS, createMCPBillingSystem } from './billing-system';
export { MCPAnalyticsEngine, createMCPAnalyticsEngine } from './analytics-engine';
export { MCPCommunityFeatures, createMCPCommunityFeatures } from './community-features';
export { MCPEnterpriseSecurity, createMCPEnterpriseSecurity } from './enterprise-security';
export { MCPRealtimeMonitor, createMCPRealtimeMonitor } from './realtime-monitor';
export { MCPInstallationManager, createMCPInstallationManager } from './installation-manager';
export { MCPPerformanceMonitor, createMCPPerformanceMonitor } from './performance-monitor';
export { MCPAIAssistant, createMCPAIAssistant } from './ai-assistant';

// NEW: Explainable AI and Enhanced User Experience
export { MCPExplainableAI, createMCPExplainableAI } from './explainable-ai';
export { MCPOnboardingEngine, createMCPOnboardingEngine } from './onboarding-engine';

// Integration and setup
export { MCPIntegration, MCPIntegrationPlugin, createMCPIntegration } from './mcp-integration';
export { MCPDatabaseSetup, createMCPDatabaseSetup } from './database-setup';

// Type definitions
export type {
  MCPServer,
  MCPTool,
  MCPWorkflow,
  ServerSearchQuery,
  ServerSearchResult,
  SemanticSearchQuery,
  SemanticSearchResult,
  SubscriptionTier,
  UserSubscription,
  UsageEvent,
  AnalyticsEvent,
  UserAnalytics,
  PlatformAnalytics,
  CommunityProfile,
  ServerReview,
  SecurityLevel,
  SecurityPolicy,
  PerformanceMetrics,
  ScalingConfiguration,
  // NEW: Explainable AI types
  AIExplanation,
  UserContext,
  WorkflowInsight,
  // NEW: Onboarding types
  OnboardingSession,
  OnboardingStep,
  OnboardingProgress
} from './server-registry';

/**
 * Enhanced MCP Integration Factory with Explainable AI
 * 
 * Complete factory for initializing MCP functionality including
 * Explainable AI, Professional Onboarding, and Advanced UX
 */
export class EnhancedMCPFactory {
  static async createFullIntegration(config: {
    database: any;
    openai?: { apiKey: string; model?: string };
    stripe?: { secretKey: string; webhookSecret: string };
    features: {
      semanticSearch?: boolean;
      communityFeatures?: boolean;
      analytics?: boolean;
      billing?: boolean;
      enterpriseSecurity?: boolean;
      realtimeMonitoring?: boolean;
      explainableAI?: boolean;
      professionalOnboarding?: boolean;
    };
  }, dependencies: {
    pool: any;
    logger: any;
    errorManager: any;
    eventBus: any;
  }) {
    const { pool, logger, errorManager, eventBus } = dependencies;
    
    // Initialize core components
    const serverRegistry = createMCPServerRegistry(pool, logger, errorManager, eventBus);
    
    // Initialize optional components based on configuration
    let semanticSearch = null;
    if (config.features.semanticSearch && config.openai?.apiKey) {
      const embeddingProvider = new OpenAIEmbeddingProvider(
        config.openai.apiKey,
        logger,
        config.openai.model
      );
      semanticSearch = createSemanticSearchEngine(pool, logger, errorManager, embeddingProvider);
    }
    
    let billingSystem = null;
    if (config.features.billing && config.stripe?.secretKey) {
      billingSystem = createMCPBillingSystem(
        config.stripe.secretKey,
        pool, logger, errorManager, eventBus
      );
    }
    
    let analyticsEngine = null;
    if (config.features.analytics) {
      analyticsEngine = createMCPAnalyticsEngine(pool, logger, errorManager, eventBus);
    }
    
    let communityFeatures = null;
    if (config.features.communityFeatures) {
      communityFeatures = createMCPCommunityFeatures(pool, logger, errorManager, eventBus);
    }
    
    let enterpriseSecurity = null;
    if (config.features.enterpriseSecurity) {
      enterpriseSecurity = createMCPEnterpriseSecurity(pool, logger, errorManager, eventBus);
    }
    
    let realtimeMonitor = null;
    if (config.features.realtimeMonitoring) {
      realtimeMonitor = createMCPRealtimeMonitor(pool, logger, errorManager, eventBus);
    }
    
    // NEW: Enhanced AI and UX features
    let explainableAI = null;
    if (config.features.explainableAI) {
      explainableAI = createMCPExplainableAI(logger, errorManager);
    }
    
    let onboardingEngine = null;
    if (config.features.professionalOnboarding && explainableAI) {
      onboardingEngine = createMCPOnboardingEngine(logger, errorManager, eventBus, explainableAI);
    }
    
    const installationManager = createMCPInstallationManager(pool, logger, errorManager, eventBus);
    const performanceMonitor = createMCPPerformanceMonitor(pool, logger, errorManager, eventBus);
    
    let aiAssistant = null;
    if (semanticSearch) {
      aiAssistant = createMCPAIAssistant(
        logger, errorManager, serverRegistry, semanticSearch, config.openai?.apiKey
      );
    }
    
    // Create main integration
    const integration = createMCPIntegration(
      {
        database: config.database,
        openai: config.openai,
        features: config.features
      },
      logger,
      errorManager,
      eventBus
    );
    
    return {
      // Core services
      serverRegistry,
      semanticSearch,
      billingSystem,
      analyticsEngine,
      communityFeatures,
      enterpriseSecurity,
      realtimeMonitor,
      installationManager,
      performanceMonitor,
      aiAssistant,
      
      // NEW: Enhanced UX services
      explainableAI,
      onboardingEngine,
      
      // Main integration
      integration,
      
      // Convenience methods
      async initialize() {
        await integration.initialize();
        
        // Initialize enhanced features
        if (explainableAI) {
          logger.info('🧠 Explainable AI initialized - Transparent decision making enabled');
        }
        
        if (onboardingEngine) {
          logger.info('🎓 Professional Onboarding initialized - Interactive learning ready');
        }
        
        logger.info('🎉 Enhanced MCP Integration fully initialized - "The npm for MCP Servers" with Explainable AI is ready!');
      },
      
      async start() {
        await integration.start();
        logger.info('🚀 Enhanced MCP Integration started - Professional platform is live!');
      },
      
      async stop() {
        await integration.stop();
        if (realtimeMonitor) await realtimeMonitor.close();
        if (installationManager) await installationManager.shutdown();
        if (performanceMonitor) await performanceMonitor.shutdown();
        logger.info('🛑 Enhanced MCP Integration stopped');
      },
      
      async getHealthStatus() {
        const baseHealth = await integration.getHealthStatus();
        
        return {
          ...baseHealth,
          enhanced_features: {
            explainable_ai: !!explainableAI,
            professional_onboarding: !!onboardingEngine,
            advanced_analytics: !!analyticsEngine,
            real_time_monitoring: !!realtimeMonitor
          }
        };
      },
      
      // NEW: Enhanced user experience methods
      async getUserRecommendations(userId: string, context: any) {
        if (!explainableAI) return [];
        
        return await explainableAI.explainServerRecommendation(
          context.servers || [],
          context.query || '',
          context.userContext || {}
        );
      },
      
      async startPersonalizedOnboarding(userId: string, profile: any) {
        if (!onboardingEngine) {
          throw new Error('Professional onboarding not enabled');
        }
        
        return await onboardingEngine.startOnboarding(userId, profile);
      },
      
      async getExplainableInsights(query: string, results: any, userContext: any) {
        if (!explainableAI) return null;
        
        return await explainableAI.explainSearchResults(results, query, userContext);
      }
    };
  }
}

/**
 * Enhanced default MCP configuration with new features
 */
export const ENHANCED_MCP_CONFIG = {
  features: {
    semanticSearch: true,
    communityFeatures: true,
    analytics: true,
    billing: false, // Requires Stripe configuration
    enterpriseSecurity: false, // Requires enterprise license
    realtimeMonitoring: true,
    explainableAI: true, // NEW: Transparent AI decision making
    professionalOnboarding: true // NEW: Interactive learning system
  }
};

/**
 * Enhanced quick start function with Explainable AI
 */
export async function enhancedQuickStartMCP(dependencies: {
  pool: any;
  logger: any;
  errorManager: any;
  eventBus: any;
}, customConfig?: any) {
  const config = {
    database: {
      // Uses existing pool connection
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    features: {
      ...ENHANCED_MCP_CONFIG.features,
      billing: !!process.env.STRIPE_SECRET_KEY,
      explainableAI: !!process.env.OPENAI_API_KEY, // Requires OpenAI for full functionality
      ...customConfig?.features
    }
  };
  
  const mcpSystem = await EnhancedMCPFactory.createFullIntegration(config, dependencies);
  await mcpSystem.initialize();
  await mcpSystem.start();
  
  return mcpSystem;
}

/**
 * Enhanced version information
 */
export const ENHANCED_MCP_VERSION = '2.1.0'; // Updated for Explainable AI
export const MCP_BUILD_DATE = new Date('2025-01-15');
export const ENHANCED_MCP_DESCRIPTION = 'The npm for MCP Servers with Explainable AI and Professional Onboarding';

/**
 * Enhanced feature flags for gradual rollout
 */
export const ENHANCED_MCP_FEATURES = {
  SERVER_REGISTRY: true,
  SEMANTIC_SEARCH: true,
  WORKFLOW_BUILDER: true,
  COMMUNITY_FEATURES: true,
  REAL_TIME_MONITORING: true,
  ANALYTICS_DASHBOARD: true,
  BILLING_INTEGRATION: true,
  ENTERPRISE_SECURITY: true,
  AI_ASSISTANT: true,
  PERFORMANCE_MONITORING: true,
  // NEW: Enhanced UX features
  EXPLAINABLE_AI: true,
  PROFESSIONAL_ONBOARDING: true,
  INTERACTIVE_TRAINING: true,
  BLOOMBERG_TERMINAL_UI: true,
  CONFIDENCE_SCORING: true
} as const;

/**
 * Enhanced migration status tracking
 */
export const ENHANCED_MIGRATION_STATUS = {
  DATABASE_MIGRATED: false,
  SERVICES_INTEGRATED: false,
  UI_DEPLOYED: false,
  FEATURES_ENABLED: false,
  MONITORING_ACTIVE: false,
  EXPLAINABLE_AI_ENABLED: false, // NEW
  ONBOARDING_DEPLOYED: false, // NEW
  MIGRATION_COMPLETE: false
};

/**
 * Enhanced deployment validation with new features
 */
export async function validateEnhancedMCPDeployment(dependencies: any): Promise<{
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  recommendations: string[];
  new_features: Array<{ feature: string; status: string; description: string }>;
}> {
  const checks = [];
  
  try {
    // Existing checks
    const schemaCheck = await dependencies.pool.query(`
      SELECT COUNT(*) as mcp_tables 
      FROM information_schema.tables 
      WHERE table_name LIKE 'mcp_%'
    `);
    
    checks.push({
      name: 'Database Schema',
      passed: parseInt(schemaCheck.rows[0]?.mcp_tables) >= 5,
      message: `Found ${schemaCheck.rows[0]?.mcp_tables || 0} MCP tables`
    });
    
    // Check pgvector extension
    const vectorCheck = await dependencies.pool.query(`
      SELECT 1 FROM pg_extension WHERE extname = 'vector'
    `);
    
    checks.push({
      name: 'pgvector Extension',
      passed: vectorCheck.rows.length > 0,
      message: vectorCheck.rows.length > 0 ? 'pgvector enabled' : 'pgvector not found'
    });
    
    // Check OpenAI integration (required for Explainable AI)
    const openaiEnabled = !!process.env.OPENAI_API_KEY;
    checks.push({
      name: 'OpenAI Integration (Explainable AI)',
      passed: openaiEnabled,
      message: openaiEnabled ? 'OpenAI API key configured - Explainable AI ready' : 'OpenAI API key missing - Explainable AI disabled'
    });
    
    // Check Stripe integration
    const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
    checks.push({
      name: 'Stripe Integration', 
      passed: stripeEnabled,
      message: stripeEnabled ? 'Stripe keys configured' : 'Stripe keys missing'
    });
    
  } catch (error) {
    checks.push({
      name: 'Validation Error',
      passed: false,
      message: error.message
    });
  }
  
  const allPassed = checks.every(check => check.passed);
  const recommendations = [];
  
  if (!allPassed) {
    recommendations.push('Complete failed checks before proceeding to production');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    recommendations.push('Configure OpenAI API key for Explainable AI and semantic search functionality');
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    recommendations.push('Configure Stripe keys for billing functionality');
  }
  
  // NEW: Feature status reporting
  const new_features = [
    {
      feature: 'Explainable AI',
      status: openaiEnabled ? 'Ready' : 'Requires OpenAI API key',
      description: 'Transparent AI decision making with confidence scores and reasoning explanations'
    },
    {
      feature: 'Professional Onboarding',
      status: 'Ready',
      description: 'Interactive training system with Bloomberg Terminal-style professional interface'
    },
    {
      feature: 'Quick Trainer',
      status: 'Ready', 
      description: 'Actionable step-by-step guides with AI-powered progress tracking'
    },
    {
      feature: 'Bloomberg Terminal UI',
      status: 'Ready',
      description: 'Professional three-panel layout with glassmorphism design system'
    },
    {
      feature: 'Minimal Gemini Interface',
      status: 'Ready',
      description: 'Simple chat-based interface for conversational MCP interaction'
    }
  ];
  
  return {
    valid: allPassed,
    checks,
    recommendations,
    new_features
  };
}

/**
 * Enhanced user experience configuration
 */
export const UX_CONFIGURATION = {
  interfaces: {
    minimal: {
      name: 'Minimal Chat',
      description: 'Gemini-style conversational interface',
      best_for: 'New users, quick queries, simple tasks',
      features: ['Natural language', 'Basic AI assistance', 'Quick actions']
    },
    professional: {
      name: 'Professional AI',
      description: 'Bloomberg Terminal-style with Explainable AI',
      best_for: 'Professional users, learning, transparent decisions',
      features: ['Explainable AI', 'Confidence scoring', 'Professional onboarding', 'Advanced analytics']
    },
    trainer: {
      name: 'Interactive Trainer',
      description: 'Guided learning with actionable steps',
      best_for: 'Skill development, feature mastery, hands-on practice',
      features: ['Step-by-step guidance', 'Progress tracking', 'Skill assessment', 'Interactive tutorials']
    },
    dashboard: {
      name: 'Full Analytics Dashboard',
      description: 'Complete management and analytics interface',
      best_for: 'Power users, team management, enterprise features',
      features: ['Full analytics', 'Team collaboration', 'Batch operations', 'Enterprise controls']
    }
  },
  
  onboarding_paths: {
    quick_start: {
      duration: '15 minutes',
      steps: 4,
      focus: 'Immediate value and basic competency'
    },
    comprehensive: {
      duration: '2 hours',
      steps: 12,
      focus: 'Complete platform mastery'
    },
    developer: {
      duration: '1 hour',
      steps: 8,
      focus: 'API usage and integration patterns'
    },
    enterprise: {
      duration: '45 minutes',
      steps: 6,
      focus: 'Security, compliance, and team management'
    }
  },
  
  ai_explanation_levels: {
    basic: 'Simple explanations with key factors',
    detailed: 'Comprehensive analysis with confidence scoring',
    expert: 'Technical details with algorithmic insights',
    visual: 'Graphical representations and interactive elements'
  }
};

/**
 * Enhanced success metrics and KPIs
 */
export const ENHANCED_SUCCESS_METRICS = {
  MVP_TARGETS: {
    registered_users: 1000,
    published_servers: 100,
    created_workflows: 500,
    monthly_executions: 10000,
    onboarding_completion_rate: 0.75, // NEW: 75% complete onboarding
    explainable_ai_usage: 0.60 // NEW: 60% use AI explanations
  },
  
  SCALE_TARGETS: {
    registered_users: 50000,
    published_servers: 2000,
    created_workflows: 25000,
    monthly_executions: 1000000,
    onboarding_completion_rate: 0.85, // NEW: Higher completion with better UX
    explainable_ai_usage: 0.80 // NEW: Higher AI explanation usage
  },
  
  REVENUE_TARGETS: {
    mrr_6_months: 5000,   // $5K MRR in 6 months
    mrr_12_months: 25000, // $25K MRR in 12 months  
    mrr_24_months: 83333  // $83K MRR in 24 months ($1M ARR)
  },
  
  // NEW: User experience metrics
  UX_TARGETS: {
    onboarding_completion_time: 900, // 15 minutes average
    ai_explanation_satisfaction: 0.90, // 90% find explanations helpful
    feature_discovery_rate: 0.70, // 70% discover advanced features
    user_retention_30_day: 0.85 // 85% retention after 30 days
  }
} as const;

/**
 * Enhanced brand information for complete platform
 */
export const ENHANCED_MCP_BRAND = {
  NAME: 'OpenConductor MCP Professional',
  TAGLINE: 'The npm for MCP Servers with Explainable AI',
  DESCRIPTION: 'Discover, install, and orchestrate MCP servers with transparent AI-powered workflows',
  MOTTO: 'From Server Discovery to Workflow Mastery - With Complete Transparency',
  NEW_FEATURES: [
    'Explainable AI with confidence scoring',
    'Bloomberg Terminal-style professional interface',
    'Interactive onboarding with progress tracking',
    'Quick trainer with actionable step-by-step guides',
    'Advanced user experience optimization'
  ]
} as const;

// Enhanced default export for convenience
export default {
  EnhancedMCPFactory,
  enhancedQuickStartMCP,
  validateEnhancedMCPDeployment,
  ENHANCED_MCP_CONFIG,
  ENHANCED_MCP_FEATURES,
  ENHANCED_MCP_BRAND,
  ENHANCED_SUCCESS_METRICS,
  UX_CONFIGURATION
};