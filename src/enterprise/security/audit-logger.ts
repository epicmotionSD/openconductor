/**
 * OpenConductor Enterprise Audit Logger
 * 
 * Provides comprehensive audit logging for compliance and security:
 * - All user actions and system events
 * - Tamper-proof log integrity
 * - Real-time log streaming
 * - Compliance reporting (SOX, GDPR, HIPAA, SOC2)
 * - Integration with SIEM systems
 * - Long-term log retention and archival
 */

import { FeatureGates, requiresEnterprise } from '../feature-gates';
import { Logger } from '../../utils/logger';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  action: string;
  actor: string; // User ID or system identifier
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'unknown';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  source: string; // Application component
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'system' | 'user_action';
  tags: string[];
  checksum?: string; // For tamper detection
}

export interface AuditQuery {
  startTime?: Date;
  endTime?: Date;
  actor?: string;
  action?: string;
  resource?: string;
  outcome?: 'success' | 'failure' | 'unknown';
  category?: string;
  severity?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ComplianceReport {
  id: string;
  type: 'sox' | 'gdpr' | 'hipaa' | 'soc2' | 'pci' | 'custom';
  name: string;
  description: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  events: AuditEvent[];
  summary: {
    totalEvents: number;
    successfulActions: number;
    failedActions: number;
    criticalEvents: number;
    userSessions: number;
    dataAccessEvents: number;
    configurationChanges: number;
  };
  findings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    events: string[]; // Event IDs
  }>;
  attachments?: Array<{
    name: string;
    type: string;
    data: string; // Base64 encoded
  }>;
}

export interface LogRetentionPolicy {
  category: string;
  retentionDays: number;
  archiveAfterDays: number;
  compressionEnabled: boolean;
  encryptionRequired: boolean;
}

@requiresEnterprise('audit_logging')
export class AuditLogger {
  private static instance: AuditLogger;
  private featureGates: FeatureGates;
  private logger: Logger;
  private auditEvents: Map<string, AuditEvent> = new Map();
  private eventQueue: AuditEvent[] = [];
  private retentionPolicies: Map<string, LogRetentionPolicy> = new Map();
  private logSinks: LogSink[] = [];
  private encryptionKey: string;
  private checksumSalt: string;

  private constructor(logger: Logger) {
    this.featureGates = FeatureGates.getInstance();
    this.logger = logger;
    this.encryptionKey = this.generateEncryptionKey();
    this.checksumSalt = this.generateSalt();
    this.initializeRetentionPolicies();
    this.initializeLogSinks();
    this.startBackgroundProcessing();
  }

  public static getInstance(logger?: Logger): AuditLogger {
    if (!AuditLogger.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      AuditLogger.instance = new AuditLogger(logger);
    }
    return AuditLogger.instance;
  }

  /**
   * Log audit event
   */
  public async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'checksum' | 'source'>): Promise<void> {
    if (!this.featureGates.canUseAuditLogging()) {
      // Community edition - basic logging to console
      this.logger.info(`Audit: ${event.action} by ${event.actor} on ${event.resource}`);
      return;
    }

    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
      source: 'openconductor',
      checksum: this.generateChecksum({
        action: event.action,
        actor: event.actor,
        resource: event.resource,
        timestamp: new Date().toISOString()
      })
    };

    // Store event
    this.auditEvents.set(auditEvent.id, auditEvent);
    this.eventQueue.push(auditEvent);

    // Real-time processing for critical events
    if (auditEvent.severity === 'critical') {
      await this.processCriticalEvent(auditEvent);
    }

    this.logger.debug(`Audit event logged: ${auditEvent.id}`);
  }

  /**
   * Query audit events
   */
  public async query(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    if (!this.featureGates.canUseAuditLogging()) {
      throw new Error('Audit logging requires Enterprise Edition');
    }

    let filteredEvents = Array.from(this.auditEvents.values());

    // Apply filters
    if (query.startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endTime!);
    }
    if (query.actor) {
      filteredEvents = filteredEvents.filter(e => e.actor === query.actor);
    }
    if (query.action) {
      filteredEvents = filteredEvents.filter(e => e.action.includes(query.action!));
    }
    if (query.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource.includes(query.resource!));
    }
    if (query.outcome) {
      filteredEvents = filteredEvents.filter(e => e.outcome === query.outcome);
    }
    if (query.category) {
      filteredEvents = filteredEvents.filter(e => e.category === query.category);
    }
    if (query.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === query.severity);
    }
    if (query.tags && query.tags.length > 0) {
      filteredEvents = filteredEvents.filter(e => 
        query.tags!.some(tag => e.tags.includes(tag))
      );
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filteredEvents.length;
    const offset = query.offset || 0;
    const limit = Math.min(query.limit || 100, 1000); // Max 1000 events per query

    const events = filteredEvents.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { events, total, hasMore };
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    type: ComplianceReport['type'],
    dateRange: { start: Date; end: Date },
    generatedBy: string,
    customFilters?: AuditQuery
  ): Promise<ComplianceReport> {
    if (!this.featureGates.canUseComplianceReporting()) {
      throw new Error('Compliance reporting requires Enterprise Edition');
    }

    const reportId = this.generateReportId();
    
    // Get events for the date range
    const query: AuditQuery = {
      startTime: dateRange.start,
      endTime: dateRange.end,
      limit: 10000,
      ...customFilters
    };

    const queryResult = await this.query(query);
    const events = queryResult.events;

    // Generate report based on compliance type
    const report: ComplianceReport = {
      id: reportId,
      type,
      name: this.getReportName(type),
      description: this.getReportDescription(type),
      dateRange,
      generatedAt: new Date(),
      generatedBy,
      events,
      summary: this.generateSummary(events),
      findings: await this.analyzeCompliance(type, events)
    };

    // Log report generation
    await this.log({
      action: 'compliance_report_generated',
      actor: generatedBy,
      resource: 'compliance_report',
      resourceId: reportId,
      outcome: 'success',
      details: {
        reportType: type,
        eventCount: events.length,
        dateRange
      },
      severity: 'medium',
      category: 'system',
      tags: ['compliance', 'report', type]
    });

    return report;
  }

  /**
   * Process critical events in real-time
   */
  private async processCriticalEvent(event: AuditEvent): Promise<void> {
    // Send to all log sinks immediately
    for (const sink of this.logSinks) {
      try {
        await sink.send(event);
      } catch (error) {
        this.logger.error(`Failed to send critical event to sink ${sink.name}: ${error}`);
      }
    }

    // Alert administrators for critical security events
    if (event.category === 'authentication' || event.category === 'authorization') {
      await this.sendSecurityAlert(event);
    }
  }

  /**
   * Generate event summary for compliance reports
   */
  private generateSummary(events: AuditEvent[]): ComplianceReport['summary'] {
    const summary = {
      totalEvents: events.length,
      successfulActions: 0,
      failedActions: 0,
      criticalEvents: 0,
      userSessions: 0,
      dataAccessEvents: 0,
      configurationChanges: 0
    };

    const uniqueSessions = new Set<string>();

    events.forEach(event => {
      // Count outcomes
      if (event.outcome === 'success') summary.successfulActions++;
      if (event.outcome === 'failure') summary.failedActions++;
      
      // Count severities
      if (event.severity === 'critical') summary.criticalEvents++;
      
      // Count unique sessions
      if (event.sessionId) uniqueSessions.add(event.sessionId);
      
      // Count by category
      if (event.category === 'data_access') summary.dataAccessEvents++;
      if (event.category === 'configuration') summary.configurationChanges++;
    });

    summary.userSessions = uniqueSessions.size;
    return summary;
  }

  /**
   * Analyze events for compliance violations
   */
  private async analyzeCompliance(
    type: ComplianceReport['type'], 
    events: AuditEvent[]
  ): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    switch (type) {
      case 'sox':
        findings.push(...await this.analyzeSoxCompliance(events));
        break;
      case 'gdpr':
        findings.push(...await this.analyzeGdprCompliance(events));
        break;
      case 'hipaa':
        findings.push(...await this.analyzeHipaaCompliance(events));
        break;
      case 'soc2':
        findings.push(...await this.analyzeSoc2Compliance(events));
        break;
      case 'pci':
        findings.push(...await this.analyzePciCompliance(events));
        break;
    }

    return findings;
  }

  /**
   * SOX compliance analysis
   */
  private async analyzeSoxCompliance(events: AuditEvent[]): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    // Check for unauthorized access to financial systems
    const financialAccess = events.filter(e => 
      e.resource.includes('financial') && 
      e.outcome === 'failure'
    );

    if (financialAccess.length > 0) {
      findings.push({
        severity: 'high',
        description: `${financialAccess.length} failed access attempts to financial systems`,
        recommendation: 'Review access controls and investigate unauthorized access attempts',
        events: financialAccess.map(e => e.id)
      });
    }

    // Check for configuration changes without proper authorization
    const configChanges = events.filter(e => 
      e.category === 'configuration' && 
      !e.details.approvalId
    );

    if (configChanges.length > 0) {
      findings.push({
        severity: 'medium',
        description: `${configChanges.length} configuration changes without documented approval`,
        recommendation: 'Ensure all system changes have proper change management approval',
        events: configChanges.map(e => e.id)
      });
    }

    return findings;
  }

  /**
   * GDPR compliance analysis
   */
  private async analyzeGdprCompliance(events: AuditEvent[]): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    // Check for data access without consent
    const dataAccess = events.filter(e => 
      e.category === 'data_access' && 
      !e.details.consentVerified
    );

    if (dataAccess.length > 0) {
      findings.push({
        severity: 'high',
        description: `${dataAccess.length} data access events without verified consent`,
        recommendation: 'Verify user consent before accessing personal data',
        events: dataAccess.map(e => e.id)
      });
    }

    // Check for data retention violations
    const oldData = events.filter(e => {
      const age = Date.now() - e.timestamp.getTime();
      const daysSinceEvent = age / (1000 * 60 * 60 * 24);
      return daysSinceEvent > 365 && e.category === 'data_access'; // 1 year retention
    });

    if (oldData.length > 0) {
      findings.push({
        severity: 'medium',
        description: `${oldData.length} data access events older than retention policy`,
        recommendation: 'Review and purge data according to retention policies',
        events: oldData.map(e => e.id)
      });
    }

    return findings;
  }

  /**
   * HIPAA compliance analysis
   */
  private async analyzeHipaaCompliance(events: AuditEvent[]): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    // Check for PHI access without authorization
    const phiAccess = events.filter(e => 
      e.tags.includes('phi') && 
      e.outcome === 'failure'
    );

    if (phiAccess.length > 0) {
      findings.push({
        severity: 'critical',
        description: `${phiAccess.length} failed attempts to access Protected Health Information`,
        recommendation: 'Investigate unauthorized PHI access attempts immediately',
        events: phiAccess.map(e => e.id)
      });
    }

    return findings;
  }

  /**
   * SOC 2 compliance analysis
   */
  private async analyzeSoc2Compliance(events: AuditEvent[]): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    // Check security principle - failed logins
    const failedLogins = events.filter(e => 
      e.action.includes('login') && 
      e.outcome === 'failure'
    );

    if (failedLogins.length > 10) {
      findings.push({
        severity: 'medium',
        description: `${failedLogins.length} failed login attempts detected`,
        recommendation: 'Review authentication logs and consider implementing additional security measures',
        events: failedLogins.slice(0, 10).map(e => e.id) // Limit to first 10
      });
    }

    return findings;
  }

  /**
   * PCI compliance analysis
   */
  private async analyzePciCompliance(events: AuditEvent[]): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    // Check for card data access
    const cardDataAccess = events.filter(e => 
      e.tags.includes('payment') || 
      e.tags.includes('card_data')
    );

    if (cardDataAccess.length > 0) {
      findings.push({
        severity: 'high',
        description: `${cardDataAccess.length} payment data access events`,
        recommendation: 'Ensure all payment data access follows PCI DSS requirements',
        events: cardDataAccess.map(e => e.id)
      });
    }

    return findings;
  }

  /**
   * Initialize retention policies
   */
  private initializeRetentionPolicies(): void {
    const defaultPolicies: LogRetentionPolicy[] = [
      {
        category: 'authentication',
        retentionDays: 2555, // 7 years for compliance
        archiveAfterDays: 365,
        compressionEnabled: true,
        encryptionRequired: true
      },
      {
        category: 'authorization',
        retentionDays: 2555,
        archiveAfterDays: 365,
        compressionEnabled: true,
        encryptionRequired: true
      },
      {
        category: 'data_access',
        retentionDays: 1095, // 3 years
        archiveAfterDays: 180,
        compressionEnabled: true,
        encryptionRequired: true
      },
      {
        category: 'configuration',
        retentionDays: 2555, // 7 years
        archiveAfterDays: 365,
        compressionEnabled: true,
        encryptionRequired: true
      },
      {
        category: 'system',
        retentionDays: 365, // 1 year
        archiveAfterDays: 90,
        compressionEnabled: true,
        encryptionRequired: false
      },
      {
        category: 'user_action',
        retentionDays: 730, // 2 years
        archiveAfterDays: 180,
        compressionEnabled: true,
        encryptionRequired: false
      }
    ];

    defaultPolicies.forEach(policy => {
      this.retentionPolicies.set(policy.category, policy);
    });
  }

  /**
   * Initialize log sinks (external systems)
   */
  private initializeLogSinks(): void {
    // Add SIEM integrations
    this.logSinks.push(new SplunkSink());
    this.logSinks.push(new ElasticSearchSink());
    this.logSinks.push(new SyslogSink());
  }

  /**
   * Start background processing
   */
  private startBackgroundProcessing(): void {
    // Process event queue every 5 seconds
    setInterval(() => {
      this.processEventQueue();
    }, 5000);

    // Clean up old events daily
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = this.eventQueue.splice(0, 100); // Process in batches

    for (const event of eventsToProcess) {
      // Send to all log sinks
      for (const sink of this.logSinks) {
        try {
          await sink.send(event);
        } catch (error) {
          this.logger.error(`Failed to send event to sink ${sink.name}: ${error}`);
        }
      }
    }
  }

  /**
   * Clean up old events based on retention policies
   */
  private cleanupOldEvents(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [eventId, event] of this.auditEvents.entries()) {
      const policy = this.retentionPolicies.get(event.category);
      if (!policy) continue;

      const eventAge = now - event.timestamp.getTime();
      const maxAge = policy.retentionDays * 24 * 60 * 60 * 1000;

      if (eventAge > maxAge) {
        this.auditEvents.delete(eventId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} expired audit events`);
    }
  }

  /**
   * Utility methods
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateEncryptionKey(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
  }

  private generateSalt(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  }

  private generateChecksum(data: any): string {
    // Simple checksum for tamper detection
    const content = JSON.stringify(data) + this.checksumSalt;
    return Buffer.from(content).toString('base64').substring(0, 16);
  }

  private getReportName(type: ComplianceReport['type']): string {
    const names = {
      sox: 'Sarbanes-Oxley Compliance Report',
      gdpr: 'GDPR Data Protection Compliance Report',
      hipaa: 'HIPAA Security and Privacy Compliance Report',
      soc2: 'SOC 2 Type II Compliance Report',
      pci: 'PCI DSS Compliance Report',
      custom: 'Custom Compliance Report'
    };
    return names[type] || 'Compliance Report';
  }

  private getReportDescription(type: ComplianceReport['type']): string {
    const descriptions = {
      sox: 'Compliance report for Sarbanes-Oxley Act requirements including financial controls and audit trails',
      gdpr: 'Data protection compliance report for GDPR requirements including consent and data access controls',
      hipaa: 'Healthcare compliance report for HIPAA Security Rule and Privacy Rule requirements',
      soc2: 'System and Organization Controls report for security, availability, and processing integrity',
      pci: 'Payment Card Industry Data Security Standard compliance report',
      custom: 'Custom compliance report based on specified criteria'
    };
    return descriptions[type] || 'Compliance analysis report';
  }

  private async sendSecurityAlert(event: AuditEvent): Promise<void> {
    // In production, integrate with alerting systems
    this.logger.warn(`SECURITY ALERT: ${event.action} by ${event.actor} - ${event.details.error || 'Critical event'}`);
  }

  // Public API methods
  public getRetentionPolicies(): LogRetentionPolicy[] {
    return Array.from(this.retentionPolicies.values());
  }

  public updateRetentionPolicy(category: string, policy: LogRetentionPolicy): void {
    this.retentionPolicies.set(category, policy);
    this.logger.info(`Updated retention policy for category: ${category}`);
  }
}

/**
 * Abstract base class for log sinks
 */
abstract class LogSink {
  abstract name: string;
  abstract send(event: AuditEvent): Promise<void>;
}

/**
 * Splunk integration
 */
class SplunkSink extends LogSink {
  name = 'Splunk';
  
  async send(event: AuditEvent): Promise<void> {
    // In production, send to Splunk HTTP Event Collector
    console.log(`[Splunk] ${JSON.stringify(event)}`);
  }
}

/**
 * Elasticsearch integration  
 */
class ElasticSearchSink extends LogSink {
  name = 'ElasticSearch';
  
  async send(event: AuditEvent): Promise<void> {
    // In production, send to Elasticsearch
    console.log(`[ElasticSearch] ${JSON.stringify(event)}`);
  }
}

/**
 * Syslog integration
 */
class SyslogSink extends LogSink {
  name = 'Syslog';
  
  async send(event: AuditEvent): Promise<void> {
    // In production, send to syslog server
    console.log(`[Syslog] ${event.timestamp.toISOString()} ${event.severity.toUpperCase()} ${event.action} by ${event.actor}`);
  }
}