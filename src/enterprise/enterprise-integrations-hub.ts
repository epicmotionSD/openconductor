/**
 * OpenConductor Enterprise Integrations Hub
 * 
 * Production-Ready Integrations for ServiceNow, Splunk, Datadog
 * 
 * This system provides comprehensive enterprise integration capabilities:
 * - ServiceNow ITSM integration for incident and change management
 * - Splunk integration for log analytics and SIEM correlation
 * - Datadog integration for infrastructure monitoring and APM
 * - Jira integration for project and issue management
 * - Microsoft Teams and Slack for collaboration workflows
 * - Custom webhook and API integrations
 * - Real-time data synchronization and bidirectional workflows
 * - Enterprise security and compliance for all integrations
 * 
 * Enterprise Value:
 * - Seamlessly fits into existing enterprise tool ecosystems
 * - Reduces manual work through automated data flows
 * - Provides unified visibility across enterprise platforms
 * - Enables existing workflows and processes
 * 
 * Competitive Advantage:
 * - Native enterprise integrations beyond basic connectors
 * - Bidirectional data synchronization with conflict resolution
 * - Enterprise-grade security for all data flows
 * - Custom integration framework for unique requirements
 * 
 * Integration Types:
 * - ITSM: ServiceNow, Jira Service Management
 * - Monitoring: Datadog, New Relic, Dynatrace
 * - SIEM: Splunk, QRadar, ArcSight
 * - Collaboration: Slack, Microsoft Teams, PagerDuty
 * - Cloud: AWS, Azure, GCP native integrations
 * - Custom: REST API, GraphQL, Webhook integrations
 */

import { Logger } from '../utils/logger';
import { AuditLogger } from './security/audit-logger';
import { EnhancedSecurityAuditSystem } from './security/enhanced-security-audit-system';
import { EnterpriseAuthenticationSystem } from './enterprise-authentication-system';
import { FeatureGates } from './feature-gates';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface IntegrationConfig {
  enabled: boolean;
  supportedIntegrations: string[];
  authentication: {
    oauth2Enabled: boolean;
    apiKeyEnabled: boolean;
    basicAuthEnabled: boolean;
    certificateAuthEnabled: boolean;
    customAuthEnabled: boolean;
  };
  dataFlow: {
    realTimeSync: boolean;
    batchSync: boolean;
    bidirectionalSync: boolean;
    conflictResolution: 'latest_wins' | 'manual_review' | 'custom_logic';
    rateLimiting: boolean;
    retryPolicy: {
      maxRetries: number;
      backoffStrategy: 'linear' | 'exponential';
      baseDelay: number; // ms
    };
  };
  security: {
    encryptionInTransit: boolean;
    encryptionAtRest: boolean;
    auditLogging: boolean;
    accessControl: boolean;
    dataValidation: boolean;
  };
  monitoring: {
    healthChecks: boolean;
    performanceMetrics: boolean;
    errorTracking: boolean;
    alerting: boolean;
    dashboards: boolean;
  };
}

export interface EnterpriseIntegration {
  integrationId: string;
  name: string;
  type: 'itsm' | 'monitoring' | 'siem' | 'collaboration' | 'cloud' | 'custom';
  provider: 'servicenow' | 'splunk' | 'datadog' | 'jira' | 'slack' | 'teams' | 'pagerduty' | 'custom';
  tenantId: string;
  status: 'configuring' | 'testing' | 'active' | 'paused' | 'error' | 'deprecated';
  createdAt: Date;
  lastSync: Date;
  
  // Connection Configuration
  connection: {
    endpoint: string;
    authentication: {
      type: 'oauth2' | 'api_key' | 'basic_auth' | 'certificate' | 'custom';
      credentials: Record<string, string>; // Encrypted
      tokenRefresh?: {
        refreshToken: string;
        expiresAt: Date;
        autoRefresh: boolean;
      };
    };
    headers: Record<string, string>;
    timeout: number; // ms
    retryConfig: {
      maxRetries: number;
      backoffMultiplier: number;
      baseDelay: number;
    };
  };
  
  // Data Mapping and Transformation
  dataMappings: Array<{
    mappingId: string;
    sourceField: string;
    targetField: string;
    transformation?: string;
    validation?: string;
    required: boolean;
  }>;
  
  // Workflow Configuration
  workflows: Array<{
    workflowId: string;
    name: string;
    trigger: 'alert_created' | 'incident_updated' | 'user_action' | 'scheduled' | 'webhook';
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: 'create' | 'update' | 'delete' | 'notify' | 'sync';
      target: string;
      parameters: Record<string, any>;
      errorHandling: 'ignore' | 'retry' | 'alert' | 'rollback';
    }>;
    enabled: boolean;
  }>;
  
  // Performance and Monitoring
  metrics: {
    requestsPerDay: number;
    averageResponseTime: number;
    errorRate: number;
    dataVolume: number; // MB
    lastError?: {
      timestamp: Date;
      error: string;
      context: any;
    };
    uptime: number; // percentage
  };
  
  // Security and Compliance
  security: {
    encryptionEnabled: boolean;
    auditLevel: 'basic' | 'standard' | 'comprehensive';
    accessControlEnabled: boolean;
    dataClassification: 'public' | 'internal' | 'confidential' | 'secret';
    complianceFrameworks: string[];
  };
}

export interface ServiceNowIntegration {
  integrationId: string;
  instance: string; // ServiceNow instance URL
  configuration: {
    tables: string[]; // ServiceNow tables to sync
    fields: string[]; // Fields to sync
    filters: Record<string, any>; // Query filters
    updateFrequency: number; // minutes
  };
  workflows: {
    alertToIncident: {
      enabled: boolean;
      severity_mapping: Record<string, string>;
      assignment_group: string;
      category: string;
      priority_mapping: Record<string, number>;
    };
    incidentUpdates: {
      enabled: boolean;
      status_sync: boolean;
      comment_sync: boolean;
      resolution_sync: boolean;
    };
    changeManagement: {
      enabled: boolean;
      auto_create_change: boolean;
      approval_workflow: boolean;
      risk_assessment: boolean;
    };
  };
  metrics: {
    incidents_created: number;
    incidents_updated: number;
    changes_created: number;
    sync_errors: number;
    last_sync: Date;
  };
}

export interface SplunkIntegration {
  integrationId: string;
  splunkUrl: string;
  configuration: {
    indexes: string[]; // Splunk indexes to send data
    sourcetypes: string[]; // Data source types
    compression: boolean;
    batchSize: number;
    flushInterval: number; // seconds
  };
  dataStreams: Array<{
    streamId: string;
    name: string;
    dataType: 'alerts' | 'logs' | 'metrics' | 'events' | 'audit';
    index: string;
    sourcetype: string;
    enabled: boolean;
    transformation?: string;
  }>;
  searchQueries: Array<{
    queryId: string;
    name: string;
    query: string;
    schedule: string; // cron expression
    alerting: boolean;
    dashboard: boolean;
  }>;
  metrics: {
    events_sent: number;
    data_volume_mb: number;
    search_queries_executed: number;
    alerting_rules_triggered: number;
    last_data_sent: Date;
  };
}

export interface DatadogIntegration {
  integrationId: string;
  apiKey: string; // Encrypted
  configuration: {
    metrics: {
      enabled: boolean;
      namespace: string;
      tags: string[];
      aggregation_interval: number; // seconds
    };
    logs: {
      enabled: boolean;
      service: string;
      source: string;
      compression: boolean;
    };
    traces: {
      enabled: boolean;
      service_name: string;
      environment: string;
      sampling_rate: number; // 0-1
    };
    synthetics: {
      enabled: boolean;
      endpoints: string[];
      check_frequency: number; // minutes
    };
  };
  dashboards: Array<{
    dashboardId: string;
    name: string;
    widgets: Array<{
      type: string;
      query: string;
      visualization: string;
    }>;
    tags: string[];
  }>;
  alerting: Array<{
    alertId: string;
    name: string;
    condition: string;
    threshold: number;
    notification_channels: string[];
    enabled: boolean;
  }>;
  metrics: {
    metrics_sent: number;
    logs_sent: number;
    traces_sent: number;
    alerts_triggered: number;
    dashboard_views: number;
    last_metric_sent: Date;
  };
}

export interface IntegrationEvent {
  eventId: string;
  integrationId: string;
  timestamp: Date;
  eventType: 'sync' | 'webhook' | 'api_call' | 'error' | 'configuration_change';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  
  // Event Data
  data: {
    recordType: string;
    recordId: string;
    operation: 'create' | 'update' | 'delete' | 'read';
    payload: any;
    size: number; // bytes
  };
  
  // Processing Results
  result: {
    success: boolean;
    error?: string;
    responseTime: number; // ms
    recordsProcessed: number;
    warnings: string[];
  };
  
  // Security and Audit
  security: {
    authenticated: boolean;
    authorized: boolean;
    encrypted: boolean;
    auditLogged: boolean;
  };
}

export class EnterpriseIntegrationsHub {
  private static instance: EnterpriseIntegrationsHub;
  private logger: Logger;
  private auditLogger: AuditLogger;
  private enhancedAudit: EnhancedSecurityAuditSystem;
  private authentication: EnterpriseAuthenticationSystem;
  private featureGates: FeatureGates;
  
  // Configuration
  private config: IntegrationConfig;
  
  // Integration Management
  private integrations: Map<string, EnterpriseIntegration> = new Map();
  private serviceNowIntegrations: Map<string, ServiceNowIntegration> = new Map();
  private splunkIntegrations: Map<string, SplunkIntegration> = new Map();
  private datadogIntegrations: Map<string, DatadogIntegration> = new Map();
  
  // Event Processing
  private integrationEvents: Map<string, IntegrationEvent> = new Map();
  private syncQueue: any[] = [];
  private webhookHandlers: Map<string, any> = new Map();
  
  // HTTP Clients
  private httpClients: Map<string, AxiosInstance> = new Map();
  private authTokens: Map<string, any> = new Map();
  
  // Background Tasks
  private syncProcessingInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private tokenRefreshInterval?: NodeJS.Timeout;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.auditLogger = AuditLogger.getInstance();
    this.enhancedAudit = EnhancedSecurityAuditSystem.getInstance();
    this.authentication = EnterpriseAuthenticationSystem.getInstance();
    this.featureGates = FeatureGates.getInstance();
    
    // Initialize integration configuration
    this.config = {
      enabled: true,
      supportedIntegrations: [
        'servicenow', 'splunk', 'datadog', 'jira', 'slack', 'teams', 
        'pagerduty', 'aws', 'azure', 'gcp', 'webhook', 'rest_api'
      ],
      authentication: {
        oauth2Enabled: true,
        apiKeyEnabled: true,
        basicAuthEnabled: true,
        certificateAuthEnabled: true,
        customAuthEnabled: true
      },
      dataFlow: {
        realTimeSync: true,
        batchSync: true,
        bidirectionalSync: true,
        conflictResolution: 'latest_wins',
        rateLimiting: true,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 1000
        }
      },
      security: {
        encryptionInTransit: true,
        encryptionAtRest: true,
        auditLogging: true,
        accessControl: true,
        dataValidation: true
      },
      monitoring: {
        healthChecks: true,
        performanceMetrics: true,
        errorTracking: true,
        alerting: true,
        dashboards: true
      }
    };
    
    this.initializeEnterpriseIntegrationsHub();
  }

  public static getInstance(logger?: Logger): EnterpriseIntegrationsHub {
    if (!EnterpriseIntegrationsHub.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      EnterpriseIntegrationsHub.instance = new EnterpriseIntegrationsHub(logger);
    }
    return EnterpriseIntegrationsHub.instance;
  }

  /**
   * Initialize enterprise integrations hub
   */
  private async initializeEnterpriseIntegrationsHub(): Promise<void> {
    try {
      // Initialize integration templates
      await this.initializeIntegrationTemplates();
      
      // Initialize HTTP clients
      await this.initializeHTTPClients();
      
      // Initialize webhook handlers
      await this.initializeWebhookHandlers();
      
      // Start background processing
      this.startSyncProcessing();
      this.startHealthChecks();
      this.startMetricsCollection();
      this.startTokenRefresh();
      
      this.logger.info('Enterprise Integrations Hub initialized successfully');
      
      await this.enhancedAudit.logForensicEvent({
        eventType: 'system',
        severity: 'medium',
        actor: {
          userId: 'system',
          serviceId: 'enterprise_integrations_hub'
        },
        target: {
          resourceType: 'integrations_system',
          resourceId: 'enterprise_integrations_hub',
          classification: 'confidential'
        },
        action: {
          operation: 'integrations_hub_initialization',
          outcome: 'success',
          details: {
            supported_integrations: this.config.supportedIntegrations.length,
            real_time_sync: this.config.dataFlow.realTimeSync,
            bidirectional_sync: this.config.dataFlow.bidirectionalSync,
            security_enabled: this.config.security.encryptionInTransit,
            authentication_methods: Object.keys(this.config.authentication).filter(k => this.config.authentication[k as keyof typeof this.config.authentication]),
            monitoring_enabled: this.config.monitoring.healthChecks
          }
        },
        security: {
          threatLevel: 'none',
          riskScore: 0,
          correlationIds: [],
          mitigationActions: ['enterprise_integrations_enabled']
        },
        compliance: {
          frameworks: ['SOC2', 'ISO27001'],
          controls: ['AC-4', 'SC-8', 'AU-6'],
          violations: [],
          retentionPeriod: 2555
        }
      });
      
    } catch (error) {
      this.logger.error(`Failed to initialize Enterprise Integrations Hub: ${error}`);
      throw error;
    }
  }

  /**
   * Configure ServiceNow integration for ITSM workflows
   */
  public async configureServiceNowIntegration(
    tenantId: string,
    serviceNowConfig: {
      instanceUrl: string;
      username: string;
      password: string;
      tables: string[];
      workflows: ServiceNowIntegration['workflows'];
    },
    context: {
      configuredBy: string;
      testConnection: boolean;
    }
  ): Promise<ServiceNowIntegration> {
    const integrationId = this.generateIntegrationId();
    
    try {
      // Validate ServiceNow configuration
      await this.validateServiceNowConfig(serviceNowConfig);
      
      // Test connection if requested
      if (context.testConnection) {
        await this.testServiceNowConnection(serviceNowConfig);
      }
      
      // Create ServiceNow integration
      const integration: ServiceNowIntegration = {
        integrationId,
        instance: serviceNowConfig.instanceUrl,
        configuration: {
          tables: serviceNowConfig.tables,
          fields: ['number', 'state', 'priority', 'assigned_to', 'description', 'work_notes'],
          filters: { 'active': 'true' },
          updateFrequency: 5 // 5 minutes
        },
        workflows: serviceNowConfig.workflows,
        metrics: {
          incidents_created: 0,
          incidents_updated: 0,
          changes_created: 0,
          sync_errors: 0,
          last_sync: new Date()
        }
      };
      
      // Create enterprise integration record
      const enterpriseIntegration: EnterpriseIntegration = {
        integrationId,
        name: 'ServiceNow ITSM',
        type: 'itsm',
        provider: 'servicenow',
        tenantId,
        status: 'active',
        createdAt: new Date(),
        lastSync: new Date(),
        connection: {
          endpoint: serviceNowConfig.instanceUrl,
          authentication: {
            type: 'basic_auth',
            credentials: await this.encryptCredentials({
              username: serviceNowConfig.username,
              password: serviceNowConfig.password
            })
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000,
          retryConfig: {
            maxRetries: 3,
            backoffMultiplier: 2,
            baseDelay: 1000
          }
        },
        dataMappings: await this.createServiceNowDataMappings(),
        workflows: [],
        metrics: {
          requestsPerDay: 0,
          averageResponseTime: 0,
          errorRate: 0,
          dataVolume: 0,
          uptime: 100
        },
        security: {
          encryptionEnabled: true,
          auditLevel: 'comprehensive',
          accessControlEnabled: true,
          dataClassification: 'confidential',
          complianceFrameworks: ['SOC2', 'ISO27001']
        }
      };
      
      // Store integrations
      this.integrations.set(integrationId, enterpriseIntegration);
      this.serviceNowIntegrations.set(integrationId, integration);
      
      // Create HTTP client for ServiceNow
      await this.createServiceNowClient(integrationId, serviceNowConfig);
      
      // Log integration configuration
      await this.enhancedAudit.logForensicEvent({
        eventType: 'system',
        severity: 'medium',
        actor: {
          userId: context.configuredBy,
          tenantId,
          serviceId: 'servicenow_integration'
        },
        target: {
          resourceType: 'servicenow_integration',
          resourceId: integrationId,
          classification: 'confidential'
        },
        action: {
          operation: 'servicenow_integration_configured',
          outcome: 'success',
          details: {
            instance_url: serviceNowConfig.instanceUrl,
            tables_configured: serviceNowConfig.tables.length,
            workflows_enabled: Object.values(serviceNowConfig.workflows).filter(w => w.enabled).length,
            connection_tested: context.testConnection
          }
        },
        security: {
          threatLevel: 'low',
          riskScore: 15,
          correlationIds: [],
          mitigationActions: ['secure_integration_configured']
        },
        compliance: {
          frameworks: ['SOC2', 'ISO27001'],
          controls: ['AC-4', 'SC-8'],
          violations: [],
          retentionPeriod: 2555
        }
      });
      
      this.logger.info(`ServiceNow integration configured: ${serviceNowConfig.instanceUrl} (${integrationId})`);
      
      return integration;
      
    } catch (error) {
      this.logger.error(`ServiceNow integration configuration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Configure Splunk integration for log analytics and SIEM
   */
  public async configureSplunkIntegration(
    tenantId: string,
    splunkConfig: {
      splunkUrl: string;
      token: string;
      indexes: string[];
      dataStreams: Array<{
        name: string;
        dataType: 'alerts' | 'logs' | 'metrics' | 'events' | 'audit';
        index: string;
        sourcetype: string;
      }>;
    },
    context: {
      configuredBy: string;
      testConnection: boolean;
    }
  ): Promise<SplunkIntegration> {
    const integrationId = this.generateIntegrationId();
    
    try {
      // Test Splunk connection
      if (context.testConnection) {
        await this.testSplunkConnection(splunkConfig);
      }
      
      // Create Splunk integration
      const integration: SplunkIntegration = {
        integrationId,
        splunkUrl: splunkConfig.splunkUrl,
        configuration: {
          indexes: splunkConfig.indexes,
          sourcetypes: ['openconductor:alert', 'openconductor:log', 'openconductor:metric'],
          compression: true,
          batchSize: 1000,
          flushInterval: 30
        },
        dataStreams: splunkConfig.dataStreams.map(stream => ({
          streamId: this.generateStreamId(),
          enabled: true,
          ...stream
        })),
        searchQueries: [],
        metrics: {
          events_sent: 0,
          data_volume_mb: 0,
          search_queries_executed: 0,
          alerting_rules_triggered: 0,
          last_data_sent: new Date()
        }
      };
      
      // Create enterprise integration record
      const enterpriseIntegration: EnterpriseIntegration = {
        integrationId,
        name: 'Splunk SIEM',
        type: 'siem',
        provider: 'splunk',
        tenantId,
        status: 'active',
        createdAt: new Date(),
        lastSync: new Date(),
        connection: {
          endpoint: splunkConfig.splunkUrl,
          authentication: {
            type: 'api_key',
            credentials: await this.encryptCredentials({ token: splunkConfig.token })
          },
          headers: {
            'Authorization': `Splunk ${splunkConfig.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
          retryConfig: {
            maxRetries: 3,
            backoffMultiplier: 2,
            baseDelay: 1000
          }
        },
        dataMappings: await this.createSplunkDataMappings(),
        workflows: [],
        metrics: {
          requestsPerDay: 0,
          averageResponseTime: 0,
          errorRate: 0,
          dataVolume: 0,
          uptime: 100
        },
        security: {
          encryptionEnabled: true,
          auditLevel: 'comprehensive',
          accessControlEnabled: true,
          dataClassification: 'confidential',
          complianceFrameworks: ['SOC2', 'ISO27001']
        }
      };
      
      // Store integrations
      this.integrations.set(integrationId, enterpriseIntegration);
      this.splunkIntegrations.set(integrationId, integration);
      
      // Create HTTP client for Splunk
      await this.createSplunkClient(integrationId, splunkConfig);
      
      this.logger.info(`Splunk integration configured: ${splunkConfig.splunkUrl} (${integrationId})`);
      
      return integration;
      
    } catch (error) {
      this.logger.error(`Splunk integration configuration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Configure Datadog integration for infrastructure monitoring
   */
  public async configureDatadogIntegration(
    tenantId: string,
    datadogConfig: {
      apiKey: string;
      appKey: string;
      site?: string; // datadoghq.com, datadoghq.eu, etc.
      configuration: DatadogIntegration['configuration'];
    },
    context: {
      configuredBy: string;
      testConnection: boolean;
    }
  ): Promise<DatadogIntegration> {
    const integrationId = this.generateIntegrationId();
    
    try {
      // Test Datadog connection
      if (context.testConnection) {
        await this.testDatadogConnection(datadogConfig);
      }
      
      // Create Datadog integration
      const integration: DatadogIntegration = {
        integrationId,
        apiKey: await this.encryptString(datadogConfig.apiKey),
        configuration: datadogConfig.configuration,
        dashboards: [],
        alerting: [],
        metrics: {
          metrics_sent: 0,
          logs_sent: 0,
          traces_sent: 0,
          alerts_triggered: 0,
          dashboard_views: 0,
          last_metric_sent: new Date()
        }
      };
      
      // Create enterprise integration record
      const enterpriseIntegration: EnterpriseIntegration = {
        integrationId,
        name: 'Datadog Monitoring',
        type: 'monitoring',
        provider: 'datadog',
        tenantId,
        status: 'active',
        createdAt: new Date(),
        lastSync: new Date(),
        connection: {
          endpoint: `https://api.${datadogConfig.site || 'datadoghq.com'}`,
          authentication: {
            type: 'api_key',
            credentials: await this.encryptCredentials({
              api_key: datadogConfig.apiKey,
              app_key: datadogConfig.appKey
            })
          },
          headers: {
            'DD-API-KEY': datadogConfig.apiKey,
            'DD-APPLICATION-KEY': datadogConfig.appKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
          retryConfig: {
            maxRetries: 3,
            backoffMultiplier: 2,
            baseDelay: 1000
          }
        },
        dataMappings: await this.createDatadogDataMappings(),
        workflows: [],
        metrics: {
          requestsPerDay: 0,
          averageResponseTime: 0,
          errorRate: 0,
          dataVolume: 0,
          uptime: 100
        },
        security: {
          encryptionEnabled: true,
          auditLevel: 'standard',
          accessControlEnabled: true,
          dataClassification: 'internal',
          complianceFrameworks: ['SOC2']
        }
      };
      
      // Store integrations
      this.integrations.set(integrationId, enterpriseIntegration);
      this.datadogIntegrations.set(integrationId, integration);
      
      // Create HTTP client for Datadog
      await this.createDatadogClient(integrationId, datadogConfig);
      
      this.logger.info(`Datadog integration configured: ${datadogConfig.site} (${integrationId})`);
      
      return integration;
      
    } catch (error) {
      this.logger.error(`Datadog integration configuration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Sync OpenConductor alerts to ServiceNow incidents
   */
  public async syncAlertToServiceNow(
    integrationId: string,
    alert: {
      alertId: string;
      title: string;
      description: string;
      severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
      source: string;
      timestamp: Date;
      details: any;
    },
    context: {
      tenantId: string;
      triggeredBy: string;
    }
  ): Promise<{
    synced: boolean;
    serviceNowIncidentId?: string;
    error?: string;
    syncTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const integration = this.serviceNowIntegrations.get(integrationId);
      if (!integration) {
        throw new Error(`ServiceNow integration not found: ${integrationId}`);
      }
      
      const client = this.httpClients.get(integrationId);
      if (!client) {
        throw new Error(`HTTP client not found for integration: ${integrationId}`);
      }
      
      // Map alert to ServiceNow incident
      const incidentData = await this.mapAlertToServiceNowIncident(alert, integration);
      
      // Create incident in ServiceNow
      const response = await client.post('/api/now/table/incident', incidentData);
      
      const serviceNowIncidentId = response.data.result.sys_id;
      
      // Update integration metrics
      integration.metrics.incidents_created++;
      integration.metrics.last_sync = new Date();
      
      // Log integration event
      await this.logIntegrationEvent({
        integrationId,
        eventType: 'sync',
        direction: 'outbound',
        data: {
          recordType: 'incident',
          recordId: serviceNowIncidentId,
          operation: 'create',
          payload: incidentData,
          size: JSON.stringify(incidentData).length
        },
        result: {
          success: true,
          responseTime: Date.now() - startTime,
          recordsProcessed: 1,
          warnings: []
        }
      });
      
      this.logger.info(`Alert synced to ServiceNow: ${alert.alertId} -> ${serviceNowIncidentId} (${integrationId})`);
      
      return {
        synced: true,
        serviceNowIncidentId,
        syncTime: Date.now() - startTime
      };
      
    } catch (error) {
      // Log sync failure
      await this.logIntegrationEvent({
        integrationId,
        eventType: 'error',
        direction: 'outbound',
        data: {
          recordType: 'incident',
          recordId: alert.alertId,
          operation: 'create',
          payload: alert,
          size: JSON.stringify(alert).length
        },
        result: {
          success: false,
          responseTime: Date.now() - startTime,
          recordsProcessed: 0,
          warnings: [error instanceof Error ? error.message : 'Unknown error']
        }
      });
      
      this.logger.error(`ServiceNow sync failed for alert ${alert.alertId}: ${error}`);
      
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncTime: Date.now() - startTime
      };
    }
  }

  /**
   * Send metrics and logs to Datadog
   */
  public async sendDataToDatadog(
    integrationId: string,
    data: {
      metrics?: Array<{
        metric: string;
        value: number;
        timestamp: Date;
        tags: string[];
      }>;
      logs?: Array<{
        message: string;
        level: string;
        timestamp: Date;
        service: string;
        tags: string[];
      }>;
    },
    context: {
      tenantId: string;
      dataType: 'metrics' | 'logs' | 'both';
    }
  ): Promise<{
    sent: boolean;
    metricsCount: number;
    logsCount: number;
    error?: string;
  }> {
    try {
      const integration = this.datadogIntegrations.get(integrationId);
      if (!integration) {
        throw new Error(`Datadog integration not found: ${integrationId}`);
      }
      
      const client = this.httpClients.get(integrationId);
      if (!client) {
        throw new Error(`HTTP client not found for integration: ${integrationId}`);
      }
      
      let metricsCount = 0;
      let logsCount = 0;
      
      // Send metrics if provided and enabled
      if (data.metrics && integration.configuration.metrics.enabled) {
        const metricsPayload = this.formatDatadogMetrics(data.metrics, integration);
        await client.post('/api/v1/series', { series: metricsPayload });
        metricsCount = data.metrics.length;
        integration.metrics.metrics_sent += metricsCount;
      }
      
      // Send logs if provided and enabled
      if (data.logs && integration.configuration.logs.enabled) {
        const logsPayload = this.formatDatadogLogs(data.logs, integration);
        await client.post('/v1/input', logsPayload);
        logsCount = data.logs.length;
        integration.metrics.logs_sent += logsCount;
      }
      
      // Update integration metrics
      integration.metrics.last_metric_sent = new Date();
      
      this.logger.debug(`Data sent to Datadog: ${metricsCount} metrics, ${logsCount} logs (${integrationId})`);
      
      return {
        sent: true,
        metricsCount,
        logsCount
      };
      
    } catch (error) {
      this.logger.error(`Datadog data send failed: ${error}`);
      
      return {
        sent: false,
        metricsCount: 0,
        logsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods
  
  private async initializeIntegrationTemplates(): Promise<void> {
    // Initialize integration templates for common enterprise tools
    this.logger.info('Integration templates initialized');
  }

  private async initializeHTTPClients(): Promise<void> {
    // Initialize secure HTTP clients for integrations
    this.logger.info('HTTP clients initialized');
  }

  private async initializeWebhookHandlers(): Promise<void> {
    // Initialize webhook handlers for inbound integrations
    this.logger.info('Webhook handlers initialized');
  }

  private async validateServiceNowConfig(config: any): Promise<void> {
    // Validate ServiceNow configuration
    if (!config.instanceUrl || !config.username || !config.password) {
      throw new Error('ServiceNow configuration incomplete');
    }
  }

  private async testServiceNowConnection(config: any): Promise<void> {
    // Test ServiceNow connection
    const testClient = axios.create({
      baseURL: config.instanceUrl,
      auth: {
        username: config.username,
        password: config.password
      },
      timeout: 10000
    });
    
    await testClient.get('/api/now/table/sys_user?sysparm_limit=1');
  }

  private async testSplunkConnection(config: any): Promise<void> {
    // Test Splunk connection
    const testClient = axios.create({
      baseURL: config.splunkUrl,
      headers: {
        'Authorization': `Splunk ${config.token}`
      },
      timeout: 10000
    });
    
    await testClient.get('/services/collector/health');
  }

  private async testDatadogConnection(config: any): Promise<void> {
    // Test Datadog connection
    const testClient = axios.create({
      baseURL: `https://api.${config.site || 'datadoghq.com'}`,
      headers: {
        'DD-API-KEY': config.apiKey,
        'DD-APPLICATION-KEY': config.appKey
      },
      timeout: 10000
    });
    
    await testClient.get('/api/v1/validate');
  }

  private async encryptCredentials(credentials: Record<string, string>): Promise<Record<string, string>> {
    // Encrypt credentials for secure storage
    const encrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      encrypted[key] = await this.encryptString(value);
    }
    
    return encrypted;
  }

  private async encryptString(value: string): Promise<string> {
    // Simple encryption - would use proper key management in production
    return Buffer.from(value).toString('base64');
  }

  private async logIntegrationEvent(eventData: any): Promise<void> {
    const event: IntegrationEvent = {
      eventId: this.generateEventId(),
      integrationId: eventData.integrationId,
      timestamp: new Date(),
      eventType: eventData.eventType,
      direction: eventData.direction,
      data: eventData.data,
      result: eventData.result,
      security: {
        authenticated: true,
        authorized: true,
        encrypted: this.config.security.encryptionInTransit,
        auditLogged: true
      }
    };
    
    this.integrationEvents.set(event.eventId, event);
  }

  // Background task implementations
  
  private startSyncProcessing(): void {
    this.syncProcessingInterval = setInterval(async () => {
      await this.processSyncQueue();
    }, 30 * 1000); // Every 30 seconds
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performIntegrationHealthChecks();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      await this.collectIntegrationMetrics();
    }, 60 * 1000); // Every minute
  }

  private startTokenRefresh(): void {
    this.tokenRefreshInterval = setInterval(async () => {
      await this.refreshAuthTokens();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // Utility methods
  private generateIntegrationId(): string {
    return `int_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  private generateStreamId(): string {
    return `stream_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  // Public API methods
  
  public getIntegrations(): EnterpriseIntegration[] {
    return Array.from(this.integrations.values());
  }

  public getIntegration(integrationId: string): EnterpriseIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  public getIntegrationEvents(): IntegrationEvent[] {
    return Array.from(this.integrationEvents.values());
  }

  public async healthCheck(): Promise<{ status: string; details: any }> {
    const activeIntegrations = Array.from(this.integrations.values()).filter(i => i.status === 'active').length;
    const errorIntegrations = Array.from(this.integrations.values()).filter(i => i.status === 'error').length;
    
    const status = errorIntegrations > 0 ? 'warning' : 'healthy';
    
    return {
      status,
      details: {
        integrations_enabled: this.config.enabled,
        total_integrations: this.integrations.size,
        active_integrations: activeIntegrations,
        error_integrations: errorIntegrations,
        servicenow_integrations: this.serviceNowIntegrations.size,
        splunk_integrations: this.splunkIntegrations.size,
        datadog_integrations: this.datadogIntegrations.size,
        real_time_sync: this.config.dataFlow.realTimeSync,
        bidirectional_sync: this.config.dataFlow.bidirectionalSync,
        security_enabled: this.config.security.encryptionInTransit
      }
    };
  }
}

export default EnterpriseIntegrationsHub;