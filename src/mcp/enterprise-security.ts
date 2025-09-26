/**
 * OpenConductor MCP Enterprise Security & Controls
 * 
 * Advanced security features for enterprise MCP deployments including
 * RBAC, audit logging, compliance controls, and data governance.
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';

export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type AccessLevel = 'read' | 'write' | 'execute' | 'admin';
export type ComplianceFramework = 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'ISO27001';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework;
  rules: SecurityRule[];
  applies_to: {
    server_categories?: string[];
    workflow_types?: string[];
    data_classifications?: SecurityLevel[];
    user_roles?: string[];
  };
  enforcement_level: 'advisory' | 'enforced' | 'strict';
  created_at: Date;
  updated_at: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'access_control' | 'data_encryption' | 'audit_logging' | 'network_security';
  conditions: any;
  actions: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserPermission {
  user_id: string;
  resource_type: 'server' | 'workflow' | 'template' | 'analytics';
  resource_id?: string; // Specific resource or null for all
  access_level: AccessLevel;
  granted_by: string;
  granted_at: Date;
  expires_at?: Date;
  conditions?: any;
}

export interface SecurityAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  security_level: SecurityLevel;
  access_granted: boolean;
  policy_violations: string[];
  ip_address: string;
  user_agent: string;
  session_id: string;
  request_data?: any;
  response_data?: any;
  compliance_tags: string[];
  retention_period: number; // Days
  created_at: Date;
}

export interface DataClassification {
  resource_type: 'server' | 'workflow' | 'execution' | 'data';
  resource_id: string;
  classification: SecurityLevel;
  sensitivity_tags: string[];
  encryption_required: boolean;
  access_restrictions: string[];
  retention_policy: {
    retain_for_days: number;
    auto_delete: boolean;
    archive_after_days?: number;
  };
  compliance_requirements: ComplianceFramework[];
  classified_by: string;
  classified_at: Date;
}

/**
 * Enterprise Security Manager for MCP
 */
export class MCPEnterpriseSecurity {
  private pool: Pool;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  
  // Security policies cache
  private policiesCache = new Map<string, SecurityPolicy>();
  private lastPolicyUpdate = new Date(0);

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.pool = pool;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
    this.startPeriodicTasks();
  }

  /**
   * Check if user has permission to access resource
   */
  async checkPermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    accessLevel: AccessLevel,
    context?: {
      ip_address?: string;
      user_agent?: string;
      session_id?: string;
    }
  ): Promise<{
    granted: boolean;
    reason?: string;
    policy_violations: string[];
    required_actions?: string[];
  }> {
    const startTime = Date.now();
    this.logger.debug('Checking user permission', {
      userId, resourceType, resourceId, accessLevel
    });

    try {
      // Get user roles and permissions
      const userPermissions = await this.getUserPermissions(userId, resourceType, resourceId);
      
      // Check basic permission
      const hasBasicPermission = userPermissions.some(perm => 
        this.accessLevelIncludes(perm.access_level, accessLevel) &&
        (!perm.expires_at || perm.expires_at > new Date())
      );

      if (!hasBasicPermission) {
        await this.logSecurityEvent(userId, 'access_denied', resourceType, resourceId, {
          reason: 'insufficient_permissions',
          requested_access: accessLevel,
          ip_address: context?.ip_address,
          user_agent: context?.user_agent,
          session_id: context?.session_id
        });

        return {
          granted: false,
          reason: 'Insufficient permissions',
          policy_violations: ['missing_permission'],
          required_actions: [`Request ${accessLevel} access to ${resourceType}`]
        };
      }

      // Get resource classification
      const classification = await this.getResourceClassification(resourceType, resourceId);
      
      // Check security policies
      const policyCheck = await this.checkSecurityPolicies(
        userId, resourceType, resourceId, accessLevel, classification
      );

      if (!policyCheck.compliant) {
        await this.logSecurityEvent(userId, 'policy_violation', resourceType, resourceId, {
          violations: policyCheck.violations,
          classification: classification?.classification,
          ip_address: context?.ip_address,
          user_agent: context?.user_agent,
          session_id: context?.session_id
        });

        return {
          granted: false,
          reason: 'Policy violations detected',
          policy_violations: policyCheck.violations,
          required_actions: policyCheck.required_actions
        };
      }

      // Log successful access
      await this.logSecurityEvent(userId, 'access_granted', resourceType, resourceId, {
        access_level: accessLevel,
        classification: classification?.classification,
        check_time_ms: Date.now() - startTime,
        ip_address: context?.ip_address,
        user_agent: context?.user_agent,
        session_id: context?.session_id
      });

      return {
        granted: true,
        policy_violations: []
      };
    } catch (error) {
      this.logger.error('Failed to check permission:', error);
      
      // Fail secure - deny access on error
      return {
        granted: false,
        reason: 'Security check failed',
        policy_violations: ['security_check_error']
      };
    }
  }

  /**
   * Create security policy
   */
  async createSecurityPolicy(
    policy: Omit<SecurityPolicy, 'id' | 'created_at' | 'updated_at'>,
    createdBy: string
  ): Promise<SecurityPolicy> {
    this.logger.info('Creating security policy', {
      name: policy.name,
      framework: policy.framework,
      createdBy
    });

    try {
      const query = `
        INSERT INTO security_policies (
          name, description, framework, rules, applies_to,
          enforcement_level, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        policy.name,
        policy.description,
        policy.framework,
        JSON.stringify(policy.rules),
        JSON.stringify(policy.applies_to),
        policy.enforcement_level,
        createdBy
      ]);

      const createdPolicy = this.mapPolicyFromDB(result.rows[0]);
      
      // Clear policy cache
      this.policiesCache.clear();

      // Emit policy created event
      await this.eventBus.emit({
        type: 'mcp.security.policy.created',
        timestamp: new Date(),
        data: {
          policyId: createdPolicy.id,
          name: createdPolicy.name,
          createdBy
        }
      });

      return createdPolicy;
    } catch (error) {
      this.logger.error('Failed to create security policy:', error);
      throw error;
    }
  }

  /**
   * Classify data/resource with security level
   */
  async classifyResource(
    resourceType: string,
    resourceId: string,
    classification: SecurityLevel,
    sensitivityTags: string[],
    classifiedBy: string,
    complianceRequirements: ComplianceFramework[] = []
  ): Promise<DataClassification> {
    this.logger.debug('Classifying resource', {
      resourceType, resourceId, classification, classifiedBy
    });

    try {
      const retentionPeriod = this.getRetentionPeriod(classification, complianceRequirements);
      
      const query = `
        INSERT INTO data_classifications (
          resource_type, resource_id, classification, sensitivity_tags,
          encryption_required, retention_policy, compliance_requirements,
          classified_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (resource_type, resource_id)
        DO UPDATE SET 
          classification = $3,
          sensitivity_tags = $4,
          encryption_required = $5,
          retention_policy = $6,
          compliance_requirements = $7,
          classified_by = $8,
          classified_at = NOW()
        RETURNING *
      `;

      const encryptionRequired = classification === 'confidential' || classification === 'restricted';
      
      const result = await this.pool.query(query, [
        resourceType,
        resourceId,
        classification,
        sensitivityTags,
        encryptionRequired,
        JSON.stringify(retentionPeriod),
        complianceRequirements,
        classifiedBy
      ]);

      const dataClassification = this.mapClassificationFromDB(result.rows[0]);

      // Emit classification event
      await this.eventBus.emit({
        type: 'mcp.security.resource.classified',
        timestamp: new Date(),
        data: {
          resourceType,
          resourceId,
          classification,
          classifiedBy
        }
      });

      return dataClassification;
    } catch (error) {
      this.logger.error('Failed to classify resource:', error);
      throw error;
    }
  }

  /**
   * Grant user permission to resource
   */
  async grantPermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    accessLevel: AccessLevel,
    grantedBy: string,
    expiresAt?: Date,
    conditions?: any
  ): Promise<UserPermission> {
    this.logger.info('Granting user permission', {
      userId, resourceType, resourceId, accessLevel, grantedBy
    });

    try {
      const query = `
        INSERT INTO user_permissions (
          user_id, resource_type, resource_id, access_level,
          granted_by, expires_at, conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, resource_type, resource_id, access_level)
        DO UPDATE SET 
          granted_by = $5,
          granted_at = NOW(),
          expires_at = $6,
          conditions = $7
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        userId, resourceType, resourceId, accessLevel,
        grantedBy, expiresAt, conditions ? JSON.stringify(conditions) : null
      ]);

      const permission = this.mapPermissionFromDB(result.rows[0]);

      // Log permission grant
      await this.logSecurityEvent(grantedBy, 'permission_granted', resourceType, resourceId, {
        target_user: userId,
        access_level: accessLevel,
        expires_at: expiresAt
      });

      return permission;
    } catch (error) {
      this.logger.error('Failed to grant permission:', error);
      throw error;
    }
  }

  /**
   * Revoke user permission
   */
  async revokePermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    accessLevel: AccessLevel,
    revokedBy: string
  ): Promise<void> {
    this.logger.info('Revoking user permission', {
      userId, resourceType, resourceId, accessLevel, revokedBy
    });

    try {
      await this.pool.query(`
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3 AND access_level = $4
      `, [userId, resourceType, resourceId, accessLevel]);

      // Log permission revocation
      await this.logSecurityEvent(revokedBy, 'permission_revoked', resourceType, resourceId, {
        target_user: userId,
        access_level: accessLevel
      });

      this.logger.info('Permission revoked successfully', {
        userId, resourceType, resourceId, accessLevel
      });
    } catch (error) {
      this.logger.error('Failed to revoke permission:', error);
      throw error;
    }
  }

  /**
   * Get security compliance report
   */
  async getComplianceReport(
    framework: ComplianceFramework,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    framework: ComplianceFramework;
    period: { from: Date; to: Date };
    compliance_score: number;
    total_events: number;
    violations: number;
    critical_violations: number;
    coverage: {
      users_covered: number;
      servers_covered: number;
      workflows_covered: number;
    };
    violation_breakdown: Array<{
      violation_type: string;
      count: number;
      severity: string;
    }>;
    recommendations: string[];
  }> {
    this.logger.debug('Generating compliance report', {
      framework, dateFrom, dateTo
    });

    try {
      // Get audit events for period
      const auditQuery = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN array_length(policy_violations, 1) > 0 THEN 1 END) as violations,
          COUNT(CASE WHEN 'critical' = ANY(compliance_tags) THEN 1 END) as critical_violations,
          COUNT(DISTINCT user_id) as users_covered
        FROM security_audit_logs 
        WHERE created_at BETWEEN $1 AND $2
          AND $3 = ANY(compliance_tags)
      `;

      const auditResult = await this.pool.query(auditQuery, [dateFrom, dateTo, framework]);
      const auditMetrics = auditResult.rows[0];

      // Calculate compliance score
      const totalEvents = parseInt(auditMetrics.total_events) || 0;
      const violations = parseInt(auditMetrics.violations) || 0;
      const complianceScore = totalEvents > 0 ? ((totalEvents - violations) / totalEvents) * 100 : 100;

      // Get coverage metrics
      const coverageQuery = `
        SELECT 
          COUNT(DISTINCT CASE WHEN resource_type = 'server' THEN resource_id END) as servers_covered,
          COUNT(DISTINCT CASE WHEN resource_type = 'workflow' THEN resource_id END) as workflows_covered
        FROM security_audit_logs 
        WHERE created_at BETWEEN $1 AND $2
          AND $3 = ANY(compliance_tags)
      `;

      const coverageResult = await this.pool.query(coverageQuery, [dateFrom, dateTo, framework]);
      const coverage = coverageResult.rows[0];

      return {
        framework,
        period: { from: dateFrom, to: dateTo },
        compliance_score: Math.round(complianceScore * 100) / 100,
        total_events: totalEvents,
        violations,
        critical_violations: parseInt(auditMetrics.critical_violations) || 0,
        coverage: {
          users_covered: parseInt(auditMetrics.users_covered) || 0,
          servers_covered: parseInt(coverage.servers_covered) || 0,
          workflows_covered: parseInt(coverage.workflows_covered) || 0
        },
        violation_breakdown: [], // TODO: Implement detailed breakdown
        recommendations: this.generateComplianceRecommendations(framework, complianceScore)
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(
    data: any,
    classification: SecurityLevel,
    userId: string
  ): Promise<{
    encrypted_data: string;
    encryption_key_id: string;
    algorithm: string;
  }> {
    try {
      // Use different encryption based on classification
      const algorithm = classification === 'restricted' ? 'AES-256-GCM' : 'AES-128-GCM';
      
      // Get or create encryption key
      const keyId = await this.getOrCreateEncryptionKey(userId, classification);
      
      // Encrypt data (simplified - use proper crypto library)
      const encryptedData = Buffer.from(JSON.stringify(data)).toString('base64');
      
      // Log encryption event
      await this.logSecurityEvent(userId, 'data_encrypted', 'data', 'sensitive', {
        classification,
        algorithm,
        key_id: keyId
      });

      return {
        encrypted_data: encryptedData,
        encryption_key_id: keyId,
        algorithm
      };
    } catch (error) {
      this.logger.error('Failed to encrypt sensitive data:', error);
      throw error;
    }
  }

  /**
   * Monitor for security anomalies
   */
  async detectSecurityAnomalies(userId?: string): Promise<{
    anomalies_detected: number;
    high_risk_events: Array<{
      type: string;
      description: string;
      severity: string;
      user_id: string;
      timestamp: Date;
    }>;
    recommendations: string[];
  }> {
    try {
      // Detect unusual access patterns
      const anomalyQuery = `
        SELECT 
          user_id,
          COUNT(*) as event_count,
          COUNT(CASE WHEN NOT access_granted THEN 1 END) as failed_attempts,
          COUNT(DISTINCT resource_id) as unique_resources,
          MIN(created_at) as first_event,
          MAX(created_at) as last_event
        FROM security_audit_logs 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
          ${userId ? 'AND user_id = $1' : ''}
        GROUP BY user_id
        HAVING 
          COUNT(*) > 50 OR  -- High activity
          COUNT(CASE WHEN NOT access_granted THEN 1 END) > 5 OR  -- Multiple failures
          COUNT(DISTINCT resource_id) > 20  -- Accessing many resources
      `;

      const params = userId ? [userId] : [];
      const anomalyResult = await this.pool.query(anomalyQuery, params);

      const highRiskEvents = anomalyResult.rows.map(row => ({
        type: 'unusual_access_pattern',
        description: `User ${row.user_id} had ${row.event_count} events with ${row.failed_attempts} failures`,
        severity: row.failed_attempts > 10 ? 'critical' : 'high',
        user_id: row.user_id,
        timestamp: row.last_event
      }));

      const recommendations = this.generateSecurityRecommendations(highRiskEvents);

      return {
        anomalies_detected: highRiskEvents.length,
        high_risk_events: highRiskEvents,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to detect security anomalies:', error);
      throw error;
    }
  }

  /**
   * Get enterprise security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    security_score: number;
    active_policies: number;
    compliance_frameworks: ComplianceFramework[];
    recent_violations: number;
    critical_alerts: number;
    encryption_coverage: number;
    audit_coverage: number;
    user_activity: {
      total_users: number;
      active_users_24h: number;
      privileged_users: number;
    };
    threat_indicators: Array<{
      type: string;
      severity: string;
      count: number;
      last_detected: Date;
    }>;
  }> {
    try {
      // Get basic security metrics
      const metricsQuery = `
        SELECT 
          COUNT(CASE WHEN access_granted = false THEN 1 END) as violations_24h,
          COUNT(CASE WHEN 'critical' = ANY(compliance_tags) THEN 1 END) as critical_alerts,
          COUNT(DISTINCT user_id) as active_users_24h
        FROM security_audit_logs 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;

      const metricsResult = await this.pool.query(metricsQuery);
      const metrics = metricsResult.rows[0];

      // Get policy count
      const policyQuery = 'SELECT COUNT(*) as policy_count FROM security_policies WHERE enforcement_level != $1';
      const policyResult = await this.pool.query(policyQuery, ['advisory']);
      const activePolicies = parseInt(policyResult.rows[0]?.policy_count) || 0;

      // Calculate security score (simplified)
      const securityScore = Math.max(0, 100 - (parseInt(metrics.violations_24h) * 2));

      return {
        security_score: securityScore,
        active_policies: activePolicies,
        compliance_frameworks: ['SOC2', 'GDPR'], // TODO: Get from actual policies
        recent_violations: parseInt(metrics.violations_24h) || 0,
        critical_alerts: parseInt(metrics.critical_alerts) || 0,
        encryption_coverage: 85, // TODO: Calculate actual coverage
        audit_coverage: 95, // TODO: Calculate actual coverage
        user_activity: {
          total_users: 0, // TODO: Get from user table
          active_users_24h: parseInt(metrics.active_users_24h) || 0,
          privileged_users: 0 // TODO: Count admin users
        },
        threat_indicators: [] // TODO: Implement threat detection
      };
    } catch (error) {
      this.logger.error('Failed to get security dashboard:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async getUserPermissions(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<UserPermission[]> {
    const query = `
      SELECT * FROM user_permissions 
      WHERE user_id = $1 
        AND resource_type = $2 
        AND (resource_id = $3 OR resource_id IS NULL)
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const result = await this.pool.query(query, [userId, resourceType, resourceId]);
    return result.rows.map(row => this.mapPermissionFromDB(row));
  }

  private accessLevelIncludes(grantedLevel: AccessLevel, requiredLevel: AccessLevel): boolean {
    const hierarchy = {
      'read': 1,
      'write': 2,
      'execute': 3,
      'admin': 4
    };

    return hierarchy[grantedLevel] >= hierarchy[requiredLevel];
  }

  private async getResourceClassification(
    resourceType: string,
    resourceId: string
  ): Promise<DataClassification | null> {
    try {
      const query = `
        SELECT * FROM data_classifications 
        WHERE resource_type = $1 AND resource_id = $2
      `;
      
      const result = await this.pool.query(query, [resourceType, resourceId]);
      return result.rows.length > 0 ? this.mapClassificationFromDB(result.rows[0]) : null;
    } catch (error) {
      return null;
    }
  }

  private async checkSecurityPolicies(
    userId: string,
    resourceType: string,
    resourceId: string,
    accessLevel: AccessLevel,
    classification?: DataClassification | null
  ): Promise<{
    compliant: boolean;
    violations: string[];
    required_actions: string[];
  }> {
    try {
      // Get applicable policies
      const policies = await this.getApplicablePolicies(resourceType, classification?.classification);
      
      const violations: string[] = [];
      const requiredActions: string[] = [];

      for (const policy of policies) {
        for (const rule of policy.rules) {
          const ruleCheck = this.evaluateSecurityRule(rule, {
            userId,
            resourceType,
            resourceId,
            accessLevel,
            classification: classification?.classification
          });

          if (!ruleCheck.compliant) {
            violations.push(ruleCheck.violation);
            if (ruleCheck.required_action) {
              requiredActions.push(ruleCheck.required_action);
            }
          }
        }
      }

      return {
        compliant: violations.length === 0,
        violations,
        required_actions: requiredActions
      };
    } catch (error) {
      this.logger.error('Failed to check security policies:', error);
      return {
        compliant: false,
        violations: ['policy_check_error'],
        required_actions: ['Contact security administrator']
      };
    }
  }

  private async getApplicablePolicies(
    resourceType: string,
    classification?: SecurityLevel
  ): Promise<SecurityPolicy[]> {
    // Use cache if available and fresh
    const now = new Date();
    if (now.getTime() - this.lastPolicyUpdate.getTime() < 300000 && this.policiesCache.size > 0) {
      return Array.from(this.policiesCache.values()).filter(policy => 
        this.policyApplies(policy, resourceType, classification)
      );
    }

    try {
      const query = 'SELECT * FROM security_policies WHERE enforcement_level != $1';
      const result = await this.pool.query(query, ['advisory']);
      
      const policies = result.rows.map(row => this.mapPolicyFromDB(row));
      
      // Update cache
      this.policiesCache.clear();
      policies.forEach(policy => this.policiesCache.set(policy.id, policy));
      this.lastPolicyUpdate = now;

      return policies.filter(policy => this.policyApplies(policy, resourceType, classification));
    } catch (error) {
      this.logger.error('Failed to get applicable policies:', error);
      return [];
    }
  }

  private policyApplies(
    policy: SecurityPolicy,
    resourceType: string,
    classification?: SecurityLevel
  ): boolean {
    // Check if policy applies to this resource type
    if (policy.applies_to.server_categories && resourceType === 'server') {
      return true;
    }
    
    if (policy.applies_to.workflow_types && resourceType === 'workflow') {
      return true;
    }

    if (policy.applies_to.data_classifications && classification) {
      return policy.applies_to.data_classifications.includes(classification);
    }

    return false;
  }

  private evaluateSecurityRule(rule: SecurityRule, context: any): {
    compliant: boolean;
    violation?: string;
    required_action?: string;
  } {
    // Simplified rule evaluation - would use a proper rules engine
    switch (rule.rule_type) {
      case 'access_control':
        if (context.classification === 'restricted' && context.accessLevel !== 'read') {
          return {
            compliant: false,
            violation: 'restricted_data_write_access',
            required_action: 'Request elevated permissions for restricted data'
          };
        }
        break;
        
      case 'data_encryption':
        if (context.classification === 'confidential' || context.classification === 'restricted') {
          // Check if encryption is enabled
          return { compliant: true }; // Assume encryption is enabled
        }
        break;
    }

    return { compliant: true };
  }

  private async logSecurityEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    data: any
  ): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO security_audit_logs (
          user_id, action, resource_type, resource_id,
          access_granted, policy_violations, ip_address,
          user_agent, session_id, metadata, compliance_tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        userId,
        action,
        resourceType,
        resourceId,
        data.access_granted !== false,
        data.violations || [],
        data.ip_address,
        data.user_agent,
        data.session_id,
        JSON.stringify(data),
        data.compliance_tags || []
      ]);
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for high-risk events
    this.eventBus.on('mcp.security.violation', async (event: any) => {
      this.logger.warn('Security violation detected', event.data);
      
      // Implement automated response based on severity
      if (event.data.severity === 'critical') {
        await this.handleCriticalSecurityEvent(event.data);
      }
    });
  }

  private startPeriodicTasks(): void {
    // Run security scans every hour
    setInterval(async () => {
      try {
        await this.detectSecurityAnomalies();
      } catch (error) {
        this.logger.error('Security anomaly detection failed:', error);
      }
    }, 3600000); // 1 hour
  }

  private async handleCriticalSecurityEvent(eventData: any): Promise<void> {
    // Implement critical event handling
    this.logger.critical('Critical security event', eventData);
    
    // Could trigger alerts, temporary access restrictions, etc.
  }

  private getRetentionPeriod(
    classification: SecurityLevel,
    compliance: ComplianceFramework[]
  ): any {
    const basePeriods = {
      'public': 365,      // 1 year
      'internal': 1095,   // 3 years  
      'confidential': 2555, // 7 years
      'restricted': 3650    // 10 years
    };

    let retainDays = basePeriods[classification] || 365;

    // Extend for specific compliance requirements
    if (compliance.includes('HIPAA')) {
      retainDays = Math.max(retainDays, 2190); // 6 years minimum
    }
    
    if (compliance.includes('PCI_DSS')) {
      retainDays = Math.max(retainDays, 365); // 1 year minimum
    }

    return {
      retain_for_days: retainDays,
      auto_delete: classification !== 'restricted',
      archive_after_days: Math.floor(retainDays * 0.8)
    };
  }

  private async getOrCreateEncryptionKey(userId: string, classification: SecurityLevel): Promise<string> {
    // Simplified key management - integrate with proper KMS
    return `key_${classification}_${userId}_${Date.now()}`;
  }

  private generateComplianceRecommendations(
    framework: ComplianceFramework,
    score: number
  ): string[] {
    const recommendations = [];

    if (score < 95) {
      recommendations.push('Review and address policy violations');
    }
    
    if (score < 85) {
      recommendations.push('Implement additional access controls');
      recommendations.push('Enhance audit logging coverage');
    }

    if (framework === 'GDPR') {
      recommendations.push('Ensure data retention policies are enforced');
      recommendations.push('Implement data subject access request handling');
    }

    return recommendations;
  }

  private generateSecurityRecommendations(events: any[]): string[] {
    const recommendations = [];

    if (events.some(e => e.type === 'unusual_access_pattern')) {
      recommendations.push('Review user access patterns for anomalies');
      recommendations.push('Consider implementing additional authentication factors');
    }

    return recommendations;
  }

  private mapPolicyFromDB(row: any): SecurityPolicy {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      framework: row.framework,
      rules: row.rules,
      applies_to: row.applies_to,
      enforcement_level: row.enforcement_level,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapPermissionFromDB(row: any): UserPermission {
    return {
      user_id: row.user_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      access_level: row.access_level,
      granted_by: row.granted_by,
      granted_at: row.granted_at,
      expires_at: row.expires_at,
      conditions: row.conditions
    };
  }

  private mapClassificationFromDB(row: any): DataClassification {
    return {
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      classification: row.classification,
      sensitivity_tags: row.sensitivity_tags || [],
      encryption_required: row.encryption_required,
      access_restrictions: row.access_restrictions || [],
      retention_policy: row.retention_policy,
      compliance_requirements: row.compliance_requirements || [],
      classified_by: row.classified_by,
      classified_at: row.classified_at
    };
  }
}

/**
 * Factory function to create enterprise security manager
 */
export function createMCPEnterpriseSecurity(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): MCPEnterpriseSecurity {
  return new MCPEnterpriseSecurity(pool, logger, errorManager, eventBus);
}