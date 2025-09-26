/**
 * OpenConductor Licensing System
 * 
 * Implements open-core business model with Community and Enterprise editions
 * Following the proven GitLab/MongoDB playbook for $B+ open-source businesses
 */

export enum Edition {
  COMMUNITY = 'community',
  ENTERPRISE = 'enterprise'
}

export enum FeatureTier {
  CORE = 'core',           // Available in all editions
  ENTERPRISE = 'enterprise' // Enterprise Edition only
}

export interface LicenseConfig {
  edition: Edition;
  organizationId?: string;
  licenseKey?: string;
  validUntil?: Date;
  maxAgents?: number;
  maxTargets?: number;
  features: string[];
  metadata?: Record<string, any>;
}

export interface FeatureDefinition {
  name: string;
  tier: FeatureTier;
  description: string;
  category: 'security' | 'governance' | 'integrations' | 'analytics' | 'scalability';
  enabled: boolean;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private license: LicenseConfig;
  private features: Map<string, FeatureDefinition> = new Map();

  private constructor() {
    this.license = this.getDefaultCommunityLicense();
    this.initializeFeatures();
  }

  public static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  public async initialize(licenseConfig?: LicenseConfig): Promise<void> {
    if (licenseConfig) {
      await this.validateAndSetLicense(licenseConfig);
    }
    
    console.log(`🔑 OpenConductor ${this.license.edition.toUpperCase()} Edition initialized`);
    console.log(`📋 Features enabled: ${this.getEnabledFeatures().length}`);
  }

  public getCurrentEdition(): Edition {
    return this.license.edition;
  }

  public isFeatureEnabled(featureName: string): boolean {
    const feature = this.features.get(featureName);
    if (!feature) return false;

    // Core features are always enabled
    if (feature.tier === FeatureTier.CORE) return true;

    // Enterprise features require Enterprise license
    if (feature.tier === FeatureTier.ENTERPRISE) {
      return this.license.edition === Edition.ENTERPRISE && this.isValidLicense();
    }

    return false;
  }

  public checkFeatureAccess(featureName: string): {
    enabled: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  } {
    const feature = this.features.get(featureName);
    
    if (!feature) {
      return { enabled: false, reason: 'Feature not found' };
    }

    if (feature.tier === FeatureTier.CORE) {
      return { enabled: true };
    }

    if (feature.tier === FeatureTier.ENTERPRISE) {
      if (this.license.edition !== Edition.ENTERPRISE) {
        return {
          enabled: false,
          reason: 'Enterprise Edition required',
          upgradeRequired: true
        };
      }

      if (!this.isValidLicense()) {
        return {
          enabled: false,
          reason: 'Invalid or expired Enterprise license',
          upgradeRequired: true
        };
      }

      return { enabled: true };
    }

    return { enabled: false, reason: 'Unknown feature tier' };
  }

  public getEnabledFeatures(): FeatureDefinition[] {
    return Array.from(this.features.values()).filter(feature => 
      this.isFeatureEnabled(feature.name)
    );
  }

  public getEnterpriseFeatures(): FeatureDefinition[] {
    return Array.from(this.features.values()).filter(feature => 
      feature.tier === FeatureTier.ENTERPRISE
    );
  }

  public getLicenseInfo(): LicenseConfig {
    return { ...this.license };
  }

  private async validateAndSetLicense(licenseConfig: LicenseConfig): Promise<void> {
    // Validate license structure
    if (!licenseConfig.edition || !Object.values(Edition).includes(licenseConfig.edition)) {
      throw new Error('Invalid license edition');
    }

    // Validate Enterprise license
    if (licenseConfig.edition === Edition.ENTERPRISE) {
      if (!licenseConfig.licenseKey || !licenseConfig.organizationId) {
        throw new Error('Enterprise license requires licenseKey and organizationId');
      }

      // In production, validate license key with licensing server
      const isValid = await this.validateEnterpriseKey(licenseConfig.licenseKey);
      if (!isValid) {
        throw new Error('Invalid Enterprise license key');
      }
    }

    this.license = licenseConfig;
  }

  private async validateEnterpriseKey(licenseKey: string): Promise<boolean> {
    // Placeholder for license validation logic
    // In production, this would validate against a licensing server
    return licenseKey.startsWith('oc-enterprise-') && licenseKey.length > 20;
  }

  private isValidLicense(): boolean {
    if (this.license.edition === Edition.COMMUNITY) return true;

    if (this.license.edition === Edition.ENTERPRISE) {
      // Check expiration
      if (this.license.validUntil && new Date() > this.license.validUntil) {
        return false;
      }

      // Check license key format
      return Boolean(this.license.licenseKey?.startsWith('oc-enterprise-'));
    }

    return false;
  }

  private getDefaultCommunityLicense(): LicenseConfig {
    return {
      edition: Edition.COMMUNITY,
      maxAgents: 10,
      maxTargets: 50,
      features: [
        'basic_monitoring',
        'trinity_agents',
        'community_support',
        'basic_analytics'
      ]
    };
  }

  private initializeFeatures(): void {
    // Core features (available in all editions)
    this.features.set('trinity_agents', {
      name: 'trinity_agents',
      tier: FeatureTier.CORE,
      description: 'Oracle, Sentinel, and Sage AI agents',
      category: 'analytics',
      enabled: true
    });

    this.features.set('basic_monitoring', {
      name: 'basic_monitoring',
      tier: FeatureTier.CORE,
      description: 'Basic system monitoring and alerting',
      category: 'analytics',
      enabled: true
    });

    this.features.set('bloomberg_terminal_ui', {
      name: 'bloomberg_terminal_ui',
      tier: FeatureTier.CORE,
      description: 'Bloomberg Terminal-style interface',
      category: 'analytics',
      enabled: true
    });

    this.features.set('community_support', {
      name: 'community_support',
      tier: FeatureTier.CORE,
      description: 'Community forums and documentation',
      category: 'analytics',
      enabled: true
    });

    // Enterprise features
    this.features.set('advanced_alert_correlation', {
      name: 'advanced_alert_correlation',
      tier: FeatureTier.ENTERPRISE,
      description: 'AI-powered alert correlation to eliminate alert fatigue',
      category: 'analytics',
      enabled: false
    });

    this.features.set('sso_integration', {
      name: 'sso_integration',
      tier: FeatureTier.ENTERPRISE,
      description: 'Single Sign-On with SAML/OIDC providers',
      category: 'security',
      enabled: false
    });

    this.features.set('rbac', {
      name: 'rbac',
      tier: FeatureTier.ENTERPRISE,
      description: 'Role-Based Access Control',
      category: 'security',
      enabled: false
    });

    this.features.set('audit_logging', {
      name: 'audit_logging',
      tier: FeatureTier.ENTERPRISE,
      description: 'Comprehensive audit trails for compliance',
      category: 'governance',
      enabled: false
    });

    this.features.set('enterprise_integrations', {
      name: 'enterprise_integrations',
      tier: FeatureTier.ENTERPRISE,
      description: 'ServiceNow, Jira, Splunk, Datadog integrations',
      category: 'integrations',
      enabled: false
    });

    this.features.set('compliance_reporting', {
      name: 'compliance_reporting',
      tier: FeatureTier.ENTERPRISE,
      description: 'SOX, GDPR, HIPAA compliance reporting',
      category: 'governance',
      enabled: false
    });

    this.features.set('unlimited_scaling', {
      name: 'unlimited_scaling',
      tier: FeatureTier.ENTERPRISE,
      description: 'Unlimited agents and monitoring targets',
      category: 'scalability',
      enabled: false
    });

    this.features.set('priority_support', {
      name: 'priority_support',
      tier: FeatureTier.ENTERPRISE,
      description: '24/7 enterprise support with SLAs',
      category: 'analytics',
      enabled: false
    });

    this.features.set('advanced_analytics', {
      name: 'advanced_analytics',
      tier: FeatureTier.ENTERPRISE,
      description: 'Advanced reporting and business intelligence',
      category: 'analytics',
      enabled: false
    });

    this.features.set('custom_workflows', {
      name: 'custom_workflows',
      tier: FeatureTier.ENTERPRISE,
      description: 'Custom agent workflows and automation',
      category: 'analytics',
      enabled: false
    });
  }

  // Utility methods for feature checks
  public requiresEnterprise(featureName: string): boolean {
    const feature = this.features.get(featureName);
    return feature?.tier === FeatureTier.ENTERPRISE;
  }

  public getUpgradeMessage(featureName: string): string {
    const feature = this.features.get(featureName);
    if (!feature) return 'Feature not available';

    if (feature.tier === FeatureTier.ENTERPRISE) {
      return `${feature.description} is available in OpenConductor Enterprise Edition. Visit https://openconductor.ai/enterprise to upgrade.`;
    }

    return 'Feature is available in your current edition';
  }

  public getFeaturesByCategory(category: string): FeatureDefinition[] {
    return Array.from(this.features.values()).filter(feature => 
      feature.category === category
    );
  }

  public checkResourceLimits(): {
    agents: { current: number; limit: number; exceeded: boolean };
    targets: { current: number; limit: number; exceeded: boolean };
  } {
    // This would integrate with actual usage tracking
    return {
      agents: {
        current: 3, // Trinity agents
        limit: this.license.maxAgents || 10,
        exceeded: false
      },
      targets: {
        current: 2, // Default targets
        limit: this.license.maxTargets || 50,
        exceeded: false
      }
    };
  }
}

// Decorators for feature gating
export function RequiresEnterprise(featureName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const licenseManager = LicenseManager.getInstance();
      const access = licenseManager.checkFeatureAccess(featureName);

      if (!access.enabled) {
        throw new Error(`Enterprise feature not available: ${access.reason}. ${licenseManager.getUpgradeMessage(featureName)}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function RequiresLicense(featureName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const licenseManager = LicenseManager.getInstance();
      
      if (!licenseManager.isFeatureEnabled(featureName)) {
        const message = licenseManager.getUpgradeMessage(featureName);
        throw new Error(`Feature not available in current edition: ${message}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}