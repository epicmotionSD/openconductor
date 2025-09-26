/**
 * OpenConductor Enterprise Feature Gates
 * 
 * Implements feature gating for open-core business model
 * Based on $27B+ AIOps market research insights
 */

import { LicenseManager, RequiresEnterprise } from '../core/licensing';

export class FeatureGates {
  private static instance: FeatureGates;
  private licenseManager: LicenseManager;

  private constructor() {
    this.licenseManager = LicenseManager.getInstance();
  }

  public static getInstance(): FeatureGates {
    if (!FeatureGates.instance) {
      FeatureGates.instance = new FeatureGates();
    }
    return FeatureGates.instance;
  }

  // Alert correlation engine - solves the 1M+ daily alerts problem
  public canUseAdvancedAlertCorrelation(): boolean {
    return this.licenseManager.isFeatureEnabled('advanced_alert_correlation');
  }

  // Enterprise integrations - ServiceNow, Jira, Splunk, Datadog
  public canUseEnterpriseIntegrations(): boolean {
    return this.licenseManager.isFeatureEnabled('enterprise_integrations');
  }

  // SSO and RBAC for security
  public canUseSSO(): boolean {
    return this.licenseManager.isFeatureEnabled('sso_integration');
  }

  public canUseRBAC(): boolean {
    return this.licenseManager.isFeatureEnabled('rbac');
  }

  // Compliance and governance
  public canUseAuditLogging(): boolean {
    return this.licenseManager.isFeatureEnabled('audit_logging');
  }

  public canUseComplianceReporting(): boolean {
    return this.licenseManager.isFeatureEnabled('compliance_reporting');
  }

  // Scalability limits
  public canCreateUnlimitedAgents(): boolean {
    return this.licenseManager.isFeatureEnabled('unlimited_scaling');
  }

  public getAgentLimit(): number {
    const limits = this.licenseManager.checkResourceLimits();
    return limits.agents.limit;
  }

  public getTargetLimit(): number {
    const limits = this.licenseManager.checkResourceLimits();
    return limits.targets.limit;
  }

  // Advanced analytics and reporting
  public canUseAdvancedAnalytics(): boolean {
    return this.licenseManager.isFeatureEnabled('advanced_analytics');
  }

  // Custom workflows and automation
  public canUseCustomWorkflows(): boolean {
    return this.licenseManager.isFeatureEnabled('custom_workflows');
  }

  // Support tiers
  public getPrioritySupportAccess(): boolean {
    return this.licenseManager.isFeatureEnabled('priority_support');
  }

  // Feature upgrade messaging
  public getUpgradeMessage(featureName: string): string {
    return this.licenseManager.getUpgradeMessage(featureName);
  }

  // Check if user has hit any limits
  public checkLimits(): {
    agents: { exceeded: boolean; current: number; limit: number };
    targets: { exceeded: boolean; current: number; limit: number };
    upgradeRequired: boolean;
  } {
    const limits = this.licenseManager.checkResourceLimits();
    
    return {
      agents: {
        exceeded: limits.agents.exceeded,
        current: limits.agents.current,
        limit: limits.agents.limit
      },
      targets: {
        exceeded: limits.targets.exceeded,
        current: limits.targets.current,
        limit: limits.targets.limit
      },
      upgradeRequired: limits.agents.exceeded || limits.targets.exceeded
    };
  }

  // Get available features for current edition
  public getAvailableFeatures(): {
    core: string[];
    enterprise: string[];
    enabled: string[];
  } {
    const allFeatures = this.licenseManager.getEnabledFeatures();
    const enterpriseFeatures = this.licenseManager.getEnterpriseFeatures();
    
    return {
      core: allFeatures.filter(f => f.tier === 'core').map(f => f.name),
      enterprise: enterpriseFeatures.map(f => f.name),
      enabled: allFeatures.map(f => f.name)
    };
  }

  // Edition display helpers
  public getCurrentEdition(): string {
    const edition = this.licenseManager.getCurrentEdition();
    return edition === 'community' ? 'Community Edition' : 'Enterprise Edition';
  }

  public showEnterpriseUpgradePrompt(): {
    show: boolean;
    message: string;
    ctaUrl: string;
  } {
    const isCommunity = this.licenseManager.getCurrentEdition() === 'community';
    
    return {
      show: isCommunity,
      message: 'Unlock enterprise features: Advanced alert correlation, unlimited scaling, priority support, and enterprise integrations.',
      ctaUrl: 'https://openconductor.ai/enterprise'
    };
  }
}

// Helper decorators for easy feature gating
export function requiresEnterprise(featureName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const featureGates = FeatureGates.getInstance();
      
      if (!featureGates.licenseManager.isFeatureEnabled(featureName)) {
        const upgradeMessage = featureGates.getUpgradeMessage(featureName);
        throw new Error(`Enterprise feature not available: ${upgradeMessage}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Feature gate guards for components
export function withEnterpriseFeature<T extends React.ComponentType<any>>(
  Component: T,
  featureName: string,
  fallbackComponent?: React.ComponentType<any>
): React.ComponentType<any> {
  return function EnterpriseFeatureWrapper(props: any) {
    const featureGates = FeatureGates.getInstance();
    const hasAccess = featureGates.licenseManager.isFeatureEnabled(featureName);

    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }

      const upgradePrompt = featureGates.showEnterpriseUpgradePrompt();
      
      return (
        <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Enterprise Feature</h3>
            <p className="text-gray-400 mb-4">{upgradePrompt.message}</p>
            <a 
              href={upgradePrompt.ctaUrl}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Upgrade to Enterprise
            </a>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}