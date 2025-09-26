/**
 * OpenConductor Enterprise Policy Engine
 * 
 * Provides comprehensive policy management and enforcement:
 * - Dynamic policy evaluation
 * - Compliance frameworks (SOX, GDPR, HIPAA, SOC2, PCI DSS)
 * - Real-time policy violations detection
 * - Automated remediation workflows
 * - Policy drift detection
 * - Governance reporting and analytics
 */

import { FeatureGates, requiresEnterprise } from '../feature-gates';
import { Logger } from '../../utils/logger';
import { AuditLogger } from '../security/audit-logger';
import { RBACManager } from '../security/rbac';

export interface Policy {
  id: string;
  name: string;
  description: string;
  framework: 'sox' | 'gdpr' | 'hipaa' | 'soc2' | 'pci' | 'iso27001' | 'custom';
  category: 'security' | 'privacy' | 'operational' | 'financial' | 'data_governance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  version: string;
  rules: PolicyRule[];
  metadata: {
    owner: string;
    reviewers: string[];
    approvedBy: string;
    effectiveDate: Date;
    reviewDate: Date;
    tags: string[];
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: PolicyCondition;
  action: PolicyAction;
  exemptions?: PolicyExemption[];
  enabled: boolean;
}

export interface PolicyCondition {
  type: 'simple' | 'compound';
  operator?: 'and' | 'or' | 'not';
  conditions?: PolicyCondition[];
  field?: string;
  comparison: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists' | 'regex';
  value?: any;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface PolicyAction {
  type: 'block' | 'allow' | 'warn' | 'audit' | 'remediate';
  message?: string;
  remediationSteps?: string[];
  escalation?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    notifyUsers: string[];
    autoRemediate: boolean;
  };
}

export interface PolicyExemption {
  id: string;
  reason: string;
  approver: string;
  expiryDate: Date;
  conditions?: Record<string, any>;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  ruleId: string;
  timestamp: Date;
  resource: string;
  resourceId?: string;
  actor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'exempt' | 'false_positive';
  remediation?: {
    action: string;
    performedBy?: string;
    performedAt?: Date;
    result: 'success' | 'failed' | 'partial';
  };
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  comments: Array<{
    author: string;
    timestamp: Date;
    content: string;
  }>;
}

export interface PolicyEvaluationContext {
  resource: string;
  resourceId?: string;
  resourceType: string;
  resourceAttributes: Record<string, any>;
  actor: string;
  actorAttributes: Record<string, any>;
  action: string;
  timestamp: Date;
  environment: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  controls: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    requirements: string[];
    mappedPolicies: string[];
  }>;
  reportingRequirements: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    stakeholders: string[];
    deliverables: string[];
  };
}

@requiresEnterprise('compliance_reporting')
export class PolicyEngine {
  private static instance: PolicyEngine;
  private featureGates: FeatureGates;
  private logger: Logger;
  private auditLogger: AuditLogger;
  private rbacManager: RBACManager;
  private policies: Map<string, Policy> = new Map();
  private violations: Map<string, PolicyViolation> = new Map();
  private frameworks: Map<string, ComplianceFramework> = new Map();
  private evaluationCache: Map<string, { result: boolean; timestamp: number }> = new Map();

  private constructor(logger: Logger) {
    this.featureGates = FeatureGates.getInstance();
    this.logger = logger;
    this.auditLogger = AuditLogger.getInstance();
    this.rbacManager = RBACManager.getInstance();
    this.initializeDefaultFrameworks();
    this.initializeDefaultPolicies();
    this.startBackgroundProcessing();
  }

  public static getInstance(logger?: Logger): PolicyEngine {
    if (!PolicyEngine.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      PolicyEngine.instance = new PolicyEngine(logger);
    }
    return PolicyEngine.instance;
  }

  /**
   * Evaluate policies against context
   */
  public async evaluatePolicies(context: PolicyEvaluationContext): Promise<{
    allowed: boolean;
    violations: PolicyViolation[];
    warnings: Array<{ policy: string; message: string }>;
    evaluatedPolicies: number;
    evaluationTime: number;
  }> {
    const startTime = Date.now();

    if (!this.featureGates.canUseComplianceReporting()) {
      return {
        allowed: true,
        violations: [],
        warnings: [],
        evaluatedPolicies: 0,
        evaluationTime: Date.now() - startTime
      };
    }

    const violations: PolicyViolation[] = [];
    const warnings: Array<{ policy: string; message: string }> = [];
    let evaluatedCount = 0;
    let blockingViolation = false;

    // Get applicable policies based on resource type and context
    const applicablePolicies = this.getApplicablePolicies(context);

    for (const policy of applicablePolicies) {
      if (!policy.enabled) continue;

      evaluatedCount++;
      const policyResult = await this.evaluatePolicy(policy, context);

      if (policyResult.violated) {
        for (const violation of policyResult.violations) {
          violations.push(violation);
          
          // Store violation
          this.violations.set(violation.id, violation);
          
          // Check if this should block the action
          if (violation.severity === 'critical' || violation.severity === 'high') {
            const rule = policy.rules.find(r => r.id === violation.ruleId);
            if (rule?.action.type === 'block') {
              blockingViolation = true;
            }
          }

          // Log audit event
          await this.auditLogger.log({
            action: 'policy_violation',
            actor: context.actor,
            resource: context.resource,
            resourceId: context.resourceId,
            outcome: 'failure',
            details: {
              policyId: policy.id,
              policyName: policy.name,
              ruleId: violation.ruleId,
              severity: violation.severity,
              framework: policy.framework
            },
            severity: violation.severity,
            category: 'system',
            tags: ['policy', 'violation', policy.framework]
          });

          // Trigger remediation if configured
          if (rule?.action.escalation?.autoRemediate) {
            await this.triggerRemediation(violation);
          }
        }
      }

      // Add warnings for medium/low severity issues
      if (policyResult.warnings.length > 0) {
        warnings.push(...policyResult.warnings.map(w => ({
          policy: policy.name,
          message: w
        })));
      }
    }

    const result = {
      allowed: !blockingViolation,
      violations,
      warnings,
      evaluatedPolicies: evaluatedCount,
      evaluationTime: Date.now() - startTime
    };

    return result;
  }

  /**
   * Create new policy
   */
  public async createPolicy(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> {
    if (!this.featureGates.canUseComplianceReporting()) {
      throw new Error('Policy management requires Enterprise Edition');
    }

    const policy: Policy = {
      id: this.generatePolicyId(),
      ...policyData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate policy rules
    this.validatePolicy(policy);

    this.policies.set(policy.id, policy);

    await this.auditLogger.log({
      action: 'policy_created',
      actor: policy.metadata.owner,
      resource: 'policy',
      resourceId: policy.id,
      outcome: 'success',
      details: {
        policyName: policy.name,
        framework: policy.framework,
        category: policy.category,
        rulesCount: policy.rules.length
      },
      severity: 'medium',
      category: 'configuration',
      tags: ['policy', 'created', policy.framework]
    });

    this.logger.info(`Policy created: ${policy.name} (${policy.id})`);
    return policy;
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    framework: string,
    dateRange: { start: Date; end: Date },
    includeViolations: boolean = true
  ): Promise<{
    framework: ComplianceFramework;
    reportId: string;
    generatedAt: Date;
    dateRange: { start: Date; end: Date };
    summary: {
      totalPolicies: number;
      activePolicies: number;
      totalViolations: number;
      criticalViolations: number;
      resolvedViolations: number;
      complianceScore: number;
    };
    controlsAssessment: Array<{
      controlId: string;
      controlName: string;
      status: 'compliant' | 'non_compliant' | 'partially_compliant';
      violations: number;
      lastAssessed: Date;
      evidence: string[];
    }>;
    violations?: PolicyViolation[];
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      affectedControls: string[];
      estimatedEffort: string;
    }>;
  }> {
    const frameworkData = this.frameworks.get(framework);
    if (!frameworkData) {
      throw new Error(`Framework not found: ${framework}`);
    }

    const reportId = this.generateReportId();
    const policies = Array.from(this.policies.values()).filter(p => p.framework === framework);
    
    // Get violations in date range
    const violations = Array.from(this.violations.values()).filter(v => 
      v.timestamp >= dateRange.start && 
      v.timestamp <= dateRange.end &&
      policies.some(p => p.id === v.policyId)
    );

    // Calculate compliance metrics
    const totalViolations = violations.length;
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const resolvedViolations = violations.filter(v => v.status === 'resolved').length;
    
    // Compliance score (0-100)
    const complianceScore = totalViolations === 0 ? 100 : 
      Math.max(0, 100 - (criticalViolations * 10 + (totalViolations - criticalViolations) * 2));

    // Assess controls
    const controlsAssessment = frameworkData.controls.map(control => {
      const controlViolations = violations.filter(v => {
        const policy = this.policies.get(v.policyId);
        return policy && control.mappedPolicies.includes(policy.id);
      });

      let status: 'compliant' | 'non_compliant' | 'partially_compliant';
      if (controlViolations.length === 0) {
        status = 'compliant';
      } else if (controlViolations.some(v => v.severity === 'critical')) {
        status = 'non_compliant';
      } else {
        status = 'partially_compliant';
      }

      return {
        controlId: control.id,
        controlName: control.name,
        status,
        violations: controlViolations.length,
        lastAssessed: new Date(),
        evidence: [`Policy evaluations: ${control.mappedPolicies.length} policies assessed`]
      };
    });

    // Generate recommendations
    const recommendations = this.generateComplianceRecommendations(violations, controlsAssessment);

    const report = {
      framework: frameworkData,
      reportId,
      generatedAt: new Date(),
      dateRange,
      summary: {
        totalPolicies: policies.length,
        activePolicies: policies.filter(p => p.enabled).length,
        totalViolations,
        criticalViolations,
        resolvedViolations,
        complianceScore
      },
      controlsAssessment,
      violations: includeViolations ? violations : undefined,
      recommendations
    };

    await this.auditLogger.log({
      action: 'compliance_report_generated',
      actor: 'system',
      resource: 'compliance_report',
      resourceId: reportId,
      outcome: 'success',
      details: {
        framework,
        dateRange,
        violationsCount: totalViolations,
        complianceScore
      },
      severity: 'medium',
      category: 'system',
      tags: ['compliance', 'report', framework]
    });

    return report;
  }

  /**
   * Evaluate single policy against context
   */
  private async evaluatePolicy(policy: Policy, context: PolicyEvaluationContext): Promise<{
    violated: boolean;
    violations: PolicyViolation[];
    warnings: string[];
  }> {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];

    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      // Check exemptions
      if (this.hasValidExemption(rule, context)) {
        continue;
      }

      // Evaluate rule condition
      const conditionMet = this.evaluateCondition(rule.condition, context);

      if (conditionMet) {
        if (rule.action.type === 'block' || rule.action.type === 'audit') {
          const violation: PolicyViolation = {
            id: this.generateViolationId(),
            policyId: policy.id,
            ruleId: rule.id,
            timestamp: context.timestamp,
            resource: context.resource,
            resourceId: context.resourceId,
            actor: context.actor,
            severity: policy.severity,
            description: rule.action.message || `Policy violation: ${rule.name}`,
            details: {
              ruleName: rule.name,
              policyName: policy.name,
              framework: policy.framework,
              context: context.metadata
            },
            status: 'open',
            comments: []
          };

          violations.push(violation);
        } else if (rule.action.type === 'warn') {
          warnings.push(rule.action.message || `Policy warning: ${rule.name}`);
        }
      }
    }

    return {
      violated: violations.length > 0,
      violations,
      warnings
    };
  }

  /**
   * Evaluate policy condition
   */
  private evaluateCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
    if (condition.type === 'compound') {
      if (!condition.conditions || condition.conditions.length === 0) {
        return false;
      }

      const results = condition.conditions.map(c => this.evaluateCondition(c, context));

      switch (condition.operator) {
        case 'and':
          return results.every(r => r);
        case 'or':
          return results.some(r => r);
        case 'not':
          return !results[0];
        default:
          return false;
      }
    }

    // Simple condition
    if (!condition.field || condition.comparison === undefined) {
      return false;
    }

    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.comparison) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return !Array.isArray(condition.value) || !condition.value.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      case 'regex':
        return new RegExp(String(condition.value)).test(String(fieldValue));
      default:
        return false;
    }
  }

  /**
   * Get field value from context
   */
  private getFieldValue(field: string, context: PolicyEvaluationContext): any {
    const path = field.split('.');
    let value: any = {
      resource: context.resourceAttributes,
      actor: context.actorAttributes,
      environment: context.environment,
      metadata: context.metadata,
      action: context.action,
      timestamp: context.timestamp.toISOString()
    };

    for (const key of path) {
      value = value?.[key];
    }

    return value;
  }

  /**
   * Check if rule has valid exemption
   */
  private hasValidExemption(rule: PolicyRule, context: PolicyEvaluationContext): boolean {
    if (!rule.exemptions || rule.exemptions.length === 0) {
      return false;
    }

    const now = new Date();
    
    for (const exemption of rule.exemptions) {
      if (exemption.expiryDate > now) {
        // Check exemption conditions if any
        if (exemption.conditions) {
          const conditionsMatch = Object.entries(exemption.conditions).every(([key, value]) => {
            const contextValue = this.getFieldValue(key, context);
            return contextValue === value;
          });
          if (conditionsMatch) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get applicable policies for context
   */
  private getApplicablePolicies(context: PolicyEvaluationContext): Policy[] {
    return Array.from(this.policies.values()).filter(policy => {
      // Basic filtering logic - can be enhanced
      return policy.enabled;
    });
  }

  /**
   * Trigger automated remediation
   */
  private async triggerRemediation(violation: PolicyViolation): Promise<void> {
    const policy = this.policies.get(violation.policyId);
    const rule = policy?.rules.find(r => r.id === violation.ruleId);
    
    if (!rule?.action.remediationSteps || rule.action.remediationSteps.length === 0) {
      return;
    }

    // Execute remediation steps
    for (const step of rule.action.remediationSteps) {
      try {
        await this.executeRemediationStep(step, violation);
      } catch (error) {
        this.logger.error(`Remediation step failed: ${step} - ${error}`);
        break;
      }
    }
  }

  /**
   * Execute remediation step
   */
  private async executeRemediationStep(step: string, violation: PolicyViolation): Promise<void> {
    // Simplified remediation execution
    // In production, integrate with automation tools
    this.logger.info(`Executing remediation: ${step} for violation ${violation.id}`);
    
    // Update violation with remediation attempt
    violation.remediation = {
      action: step,
      performedAt: new Date(),
      result: 'success'
    };
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    violations: PolicyViolation[], 
    controlsAssessment: Array<any>
  ): Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    affectedControls: string[];
    estimatedEffort: string;
  }> {
    const recommendations = [];

    // High priority: Critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        description: `Address ${criticalViolations.length} critical policy violations immediately`,
        affectedControls: [...new Set(criticalViolations.map(v => v.policyId))],
        estimatedEffort: '1-2 weeks'
      });
    }

    // Medium priority: Non-compliant controls
    const nonCompliantControls = controlsAssessment.filter(c => c.status === 'non_compliant');
    if (nonCompliantControls.length > 0) {
      recommendations.push({
        priority: 'medium' as const,
        description: `Review and remediate ${nonCompliantControls.length} non-compliant controls`,
        affectedControls: nonCompliantControls.map(c => c.controlId),
        estimatedEffort: '2-4 weeks'
      });
    }

    // Low priority: Partially compliant controls
    const partiallyCompliantControls = controlsAssessment.filter(c => c.status === 'partially_compliant');
    if (partiallyCompliantControls.length > 0) {
      recommendations.push({
        priority: 'low' as const,
        description: `Improve ${partiallyCompliantControls.length} partially compliant controls`,
        affectedControls: partiallyCompliantControls.map(c => c.controlId),
        estimatedEffort: '1-3 months'
      });
    }

    return recommendations;
  }

  /**
   * Initialize default compliance frameworks
   */
  private initializeDefaultFrameworks(): void {
    if (!this.featureGates.canUseComplianceReporting()) {
      return;
    }

    // SOX Framework
    this.frameworks.set('sox', {
      id: 'sox',
      name: 'Sarbanes-Oxley Act',
      description: 'Financial reporting and corporate governance compliance',
      version: '2002',
      controls: [
        {
          id: 'sox-302',
          name: 'Corporate Responsibility for Financial Reports',
          description: 'CEO and CFO certification of financial reports',
          category: 'financial_reporting',
          requirements: ['Executive certification', 'Financial controls assessment'],
          mappedPolicies: []
        },
        {
          id: 'sox-404',
          name: 'Management Assessment of Internal Controls',
          description: 'Assessment of internal control over financial reporting',
          category: 'internal_controls',
          requirements: ['Internal control documentation', 'Control testing', 'Deficiency reporting'],
          mappedPolicies: []
        }
      ],
      reportingRequirements: {
        frequency: 'quarterly',
        stakeholders: ['CFO', 'CEO', 'Audit Committee'],
        deliverables: ['Control assessment', 'Deficiency reports', 'Management certification']
      }
    });

    // GDPR Framework
    this.frameworks.set('gdpr', {
      id: 'gdpr',
      name: 'General Data Protection Regulation',
      description: 'Data protection and privacy compliance for EU',
      version: '2018',
      controls: [
        {
          id: 'gdpr-art6',
          name: 'Lawfulness of Processing',
          description: 'Legal basis for processing personal data',
          category: 'data_processing',
          requirements: ['Consent verification', 'Legal basis documentation'],
          mappedPolicies: []
        },
        {
          id: 'gdpr-art32',
          name: 'Security of Processing',
          description: 'Appropriate technical and organizational measures',
          category: 'data_security',
          requirements: ['Encryption', 'Access controls', 'Breach detection'],
          mappedPolicies: []
        }
      ],
      reportingRequirements: {
        frequency: 'annually',
        stakeholders: ['DPO', 'Legal', 'Security Team'],
        deliverables: ['Privacy impact assessments', 'Breach reports', 'Consent records']
      }
    });

    this.logger.info('Default compliance frameworks initialized');
  }

  /**
   * Initialize default policies
   */
  private initializeDefaultPolicies(): void {
    if (!this.featureGates.canUseComplianceReporting()) {
      return;
    }

    // Example SOX policy
    const soxPolicy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Financial System Access Control',
      description: 'Controls access to financial systems and data',
      framework: 'sox',
      category: 'financial',
      severity: 'high',
      version: '1.0',
      rules: [
        {
          id: 'rule-1',
          name: 'Segregation of Duties',
          description: 'Users cannot both create and approve financial transactions',
          condition: {
            type: 'simple',
            field: 'actor.roles',
            comparison: 'in',
            value: ['financial_creator', 'financial_approver']
          },
          action: {
            type: 'block',
            message: 'Segregation of duties violation: User has both creator and approver roles'
          },
          enabled: true
        }
      ],
      metadata: {
        owner: 'compliance-team',
        reviewers: ['cfo', 'audit-committee'],
        approvedBy: 'cfo',
        effectiveDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        tags: ['sox', 'financial', 'segregation']
      },
      enabled: true
    };

    this.createPolicy(soxPolicy).catch(error => {
      this.logger.error(`Failed to create default SOX policy: ${error}`);
    });

    this.logger.info('Default policies initialized');
  }

  /**
   * Validate policy structure
   */
  private validatePolicy(policy: Policy): void {
    if (!policy.name || !policy.description) {
      throw new Error('Policy must have name and description');
    }

    if (policy.rules.length === 0) {
      throw new Error('Policy must have at least one rule');
    }

    for (const rule of policy.rules) {
      if (!rule.condition) {
        throw new Error(`Rule ${rule.name} must have a condition`);
      }
      if (!rule.action) {
        throw new Error(`Rule ${rule.name} must have an action`);
      }
    }
  }

  /**
   * Start background processing
   */
  private startBackgroundProcessing(): void {
    // Clean up cache every hour
    setInterval(() => {
      this.cleanupEvaluationCache();
    }, 60 * 60 * 1000);

    // Check for policy drift daily
    setInterval(() => {
      this.detectPolicyDrift();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up evaluation cache
   */
  private cleanupEvaluationCache(): void {
    const now = Date.now();
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes

    for (const [key, entry] of this.evaluationCache.entries()) {
      if (now - entry.timestamp > cacheTimeout) {
        this.evaluationCache.delete(key);
      }
    }
  }

  /**
   * Detect policy drift
   */
  private async detectPolicyDrift(): Promise<void> {
    // Check for policies that haven't been reviewed
    const now = new Date();
    const overdueReviews = Array.from(this.policies.values()).filter(policy => 
      policy.metadata.reviewDate < now
    );

    if (overdueReviews.length > 0) {
      await this.auditLogger.log({
        action: 'policy_drift_detected',
        actor: 'system',
        resource: 'policy_review',
        outcome: 'unknown',
        details: {
          overdueCount: overdueReviews.length,
          policies: overdueReviews.map(p => ({ id: p.id, name: p.name }))
        },
        severity: 'medium',
        category: 'system',
        tags: ['policy', 'drift', 'review']
      });

      this.logger.warn(`Policy drift detected: ${overdueReviews.length} policies require review`);
    }
  }

  /**
   * Utility methods
   */
  private generatePolicyId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  // Public API methods
  public getPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  public getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  public getViolations(): PolicyViolation[] {
    return Array.from(this.violations.values());
  }

  public getFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  public async resolveViolation(violationId: string, resolvedBy: string, comment?: string): Promise<void> {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation not found: ${violationId}`);
    }

    violation.status = 'resolved';
    violation.resolvedBy = resolvedBy;
    violation.resolvedAt = new Date();

    if (comment) {
      violation.comments.push({
        author: resolvedBy,
        timestamp: new Date(),
        content: comment
      });
    }

    await this.auditLogger.log({
      action: 'policy_violation_resolved',
      actor: resolvedBy,
      resource: 'policy_violation',
      resourceId: violationId,
      outcome: 'success',
      details: {
        policyId: violation.policyId,
        comment
      },
      severity: 'low',
      category: 'system',
      tags: ['policy', 'violation', 'resolved']
    });
  }
}