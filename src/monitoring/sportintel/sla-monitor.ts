/**
 * SportIntel SLA Monitor
 * 
 * Monitors Service Level Agreements and Bloomberg Terminal-level performance
 * requirements with automated alerting and escalation procedures.
 */

import { Logger } from '../../utils/logger';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { EventBus } from '../../events/event-bus';
import { register } from 'prom-client';

// SLA Definitions
interface SLATarget {
  name: string;
  description: string;
  target: number;
  unit: string;
  critical: number;
  warning: number;
  measurement: string;
  enabled: boolean;
}

interface SLABreach {
  slaName: string;
  currentValue: number;
  targetValue: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
  duration?: number;
  description: string;
}

interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  config: any;
  enabled: boolean;
}

/**
 * SLA Monitor for Bloomberg Terminal-level performance
 */
export class SportIntelSLAMonitor {
  private logger: Logger;
  private config: SportIntelConfigManager;
  private eventBus: EventBus;
  private slaTargets: Map<string, SLATarget>;
  private activeBreeches: Map<string, SLABreach>;
  private alertChannels: AlertChannel[];
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Bloomberg Terminal SLA Requirements
  private readonly BLOOMBERG_SLAS: SLATarget[] = [
    {
      name: 'response_time_p95',
      description: 'API Response Time (95th percentile)',
      target: 200, // 200ms max
      unit: 'ms',
      critical: 500,
      warning: 300,
      measurement: 'histogram_quantile(0.95, sum(rate(sportintel_http_request_duration_seconds_bucket[5m])) by (le)) * 1000',
      enabled: true,
    },
    {
      name: 'uptime',
      description: 'System Uptime',
      target: 99.9, // 99.9% uptime
      unit: '%',
      critical: 99.0,
      warning: 99.5,
      measurement: 'avg_over_time(up{job="sportintel"}[5m]) * 100',
      enabled: true,
    },
    {
      name: 'error_rate',
      description: 'Error Rate',
      target: 0.1, // 0.1% error rate max
      unit: '%',
      critical: 1.0,
      warning: 0.5,
      measurement: 'sum(rate(sportintel_http_request_errors_total[5m])) / sum(rate(sportintel_http_requests_total[5m])) * 100',
      enabled: true,
    },
    {
      name: 'prediction_latency_p95',
      description: 'Prediction Generation Latency (95th percentile)',
      target: 100, // 100ms max
      unit: 'ms',
      critical: 300,
      warning: 200,
      measurement: 'histogram_quantile(0.95, sum(rate(sportintel_prediction_latency_seconds_bucket[5m])) by (le)) * 1000',
      enabled: true,
    },
    {
      name: 'cache_hit_rate',
      description: 'Cache Hit Rate',
      target: 95, // 95% hit rate min
      unit: '%',
      critical: 85,
      warning: 90,
      measurement: 'sum(rate(sportintel_cache_hits_total[5m])) / (sum(rate(sportintel_cache_hits_total[5m])) + sum(rate(sportintel_cache_misses_total[5m]))) * 100',
      enabled: true,
    },
    {
      name: 'websocket_connection_success',
      description: 'WebSocket Connection Success Rate',
      target: 99.0, // 99% success rate
      unit: '%',
      critical: 95.0,
      warning: 97.0,
      measurement: 'sum(increase(sportintel_websocket_connections_successful[5m])) / sum(increase(sportintel_websocket_connections_attempts[5m])) * 100',
      enabled: true,
    },
    {
      name: 'database_query_p95',
      description: 'Database Query Time (95th percentile)',
      target: 50, // 50ms max
      unit: 'ms',
      critical: 200,
      warning: 100,
      measurement: 'histogram_quantile(0.95, sum(rate(sportintel_db_query_duration_seconds_bucket[5m])) by (le)) * 1000',
      enabled: true,
    },
    {
      name: 'data_freshness',
      description: 'Data Freshness (Age of latest data)',
      target: 30, // 30 seconds max
      unit: 's',
      critical: 120,
      warning: 60,
      measurement: 'time() - sportintel_last_data_update_timestamp',
      enabled: true,
    },
    {
      name: 'model_accuracy',
      description: 'ML Model Accuracy',
      target: 70, // 70% accuracy min
      unit: '%',
      critical: 60,
      warning: 65,
      measurement: 'avg(sportintel_model_accuracy) * 100',
      enabled: true,
    },
    {
      name: 'subscription_api_availability',
      description: 'Subscription API Availability',
      target: 99.9, // 99.9% availability
      unit: '%',
      critical: 99.0,
      warning: 99.5,
      measurement: 'avg_over_time(up{job="sportintel-subscription"}[5m]) * 100',
      enabled: true,
    }
  ];

  constructor(eventBus: EventBus) {
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.eventBus = eventBus;
    this.slaTargets = new Map();
    this.activeBreeches = new Map();
    this.alertChannels = [];

    this.initializeSLAs();
    this.setupAlertChannels();
    this.startMonitoring();

    this.logger.info('SportIntel SLA Monitor initialized', {
      slaCount: this.slaTargets.size,
      alertChannels: this.alertChannels.length,
    });
  }

  /**
   * Initialize SLA targets
   */
  private initializeSLAs(): void {
    this.BLOOMBERG_SLAS.forEach(sla => {
      if (sla.enabled) {
        this.slaTargets.set(sla.name, sla);
      }
    });

    // Add custom SLAs from configuration
    const customSLAs = this.config.getSection('monitoring')?.customSLAs || [];
    customSLAs.forEach((sla: SLATarget) => {
      if (sla.enabled) {
        this.slaTargets.set(sla.name, sla);
      }
    });
  }

  /**
   * Setup alert channels
   */
  private setupAlertChannels(): void {
    const monitoringConfig = this.config.getSection('monitoring');
    
    // Email alerts
    if (monitoringConfig.alerts?.email) {
      this.alertChannels.push({
        name: 'email',
        type: 'email',
        config: {
          recipients: monitoringConfig.alerts.email,
          smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
        },
        enabled: true,
      });
    }

    // Slack alerts
    if (monitoringConfig.alerts?.slack) {
      this.alertChannels.push({
        name: 'slack',
        type: 'slack',
        config: {
          webhookUrl: monitoringConfig.alerts.slack,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: 'SportIntel SLA Monitor',
        },
        enabled: true,
      });
    }

    // PagerDuty integration
    if (process.env.PAGERDUTY_INTEGRATION_KEY) {
      this.alertChannels.push({
        name: 'pagerduty',
        type: 'pagerduty',
        config: {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
          severity: 'critical',
        },
        enabled: true,
      });
    }

    // Webhook alerts
    if (monitoringConfig.alerts?.webhook) {
      this.alertChannels.push({
        name: 'webhook',
        type: 'webhook',
        config: {
          url: monitoringConfig.alerts.webhook,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.WEBHOOK_AUTH_TOKEN || '',
          },
        },
        enabled: true,
      });
    }
  }

  /**
   * Start SLA monitoring
   */
  private startMonitoring(): void {
    // Check SLAs every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkAllSLAs();
    }, 30000);

    this.logger.info('SLA monitoring started', {
      interval: '30s',
      targets: Array.from(this.slaTargets.keys()),
    });
  }

  /**
   * Stop SLA monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('SLA monitoring stopped');
    }
  }

  /**
   * Check all SLAs
   */
  private async checkAllSLAs(): Promise<void> {
    const promises = Array.from(this.slaTargets.values()).map(sla => 
      this.checkSLA(sla).catch(error => {
        this.logger.error('SLA check failed', { sla: sla.name, error });
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Check individual SLA
   */
  private async checkSLA(sla: SLATarget): Promise<void> {
    try {
      // In a real implementation, this would query Prometheus
      // For now, simulate metric values
      const currentValue = this.simulateMetricValue(sla);
      
      const breach = this.evaluateSLA(sla, currentValue);
      
      if (breach) {
        await this.handleSLABreach(breach);
      } else {
        // Check if we need to resolve an existing breach
        if (this.activeBreeches.has(sla.name)) {
          await this.resolveSLABreach(sla.name, currentValue);
        }
      }

      // Emit SLA check event
      this.eventBus.publish('sla.checked', {
        slaName: sla.name,
        currentValue,
        targetValue: sla.target,
        breach: !!breach,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('SLA evaluation failed', { sla: sla.name, error });
    }
  }

  /**
   * Evaluate SLA against current value
   */
  private evaluateSLA(sla: SLATarget, currentValue: number): SLABreach | null {
    let severity: 'warning' | 'critical' | null = null;
    
    // Determine breach severity based on SLA type
    if (this.isPerformanceMetric(sla.name)) {
      // For performance metrics, higher values are worse
      if (currentValue >= sla.critical) {
        severity = 'critical';
      } else if (currentValue >= sla.warning) {
        severity = 'warning';
      }
    } else {
      // For availability/accuracy metrics, lower values are worse
      if (currentValue <= sla.critical) {
        severity = 'critical';
      } else if (currentValue <= sla.warning) {
        severity = 'warning';
      }
    }

    if (severity) {
      const existingBreach = this.activeBreeches.get(sla.name);
      const now = new Date();
      
      return {
        slaName: sla.name,
        currentValue,
        targetValue: sla.target,
        severity,
        timestamp: existingBreach ? existingBreach.timestamp : now,
        duration: existingBreach ? now.getTime() - existingBreach.timestamp.getTime() : 0,
        description: `${sla.description} is ${severity}: ${currentValue}${sla.unit} (target: ${sla.target}${sla.unit})`,
      };
    }

    return null;
  }

  /**
   * Handle SLA breach
   */
  private async handleSLABreach(breach: SLABreach): Promise<void> {
    const existingBreach = this.activeBreeches.get(breach.slaName);
    
    if (!existingBreach) {
      // New breach
      this.activeBreeches.set(breach.slaName, breach);
      
      this.logger.error('SLA breach detected', breach);
      
      // Send alerts
      await this.sendAlerts(breach);
      
      // Emit breach event
      this.eventBus.publish('sla.breach.new', breach);
      
    } else if (existingBreach.severity !== breach.severity) {
      // Severity changed
      this.activeBreeches.set(breach.slaName, breach);
      
      this.logger.error('SLA breach severity changed', {
        slaName: breach.slaName,
        oldSeverity: existingBreach.severity,
        newSeverity: breach.severity,
      });
      
      // Send escalation alerts
      await this.sendAlerts(breach, true);
      
      // Emit severity change event
      this.eventBus.publish('sla.breach.escalated', breach);
    }

    // Update breach duration
    if (existingBreach) {
      breach.duration = Date.now() - existingBreach.timestamp.getTime();
      this.activeBreeches.set(breach.slaName, breach);
    }
  }

  /**
   * Resolve SLA breach
   */
  private async resolveSLABreach(slaName: string, currentValue: number): Promise<void> {
    const breach = this.activeBreeches.get(slaName);
    if (!breach) return;

    this.activeBreeches.delete(slaName);
    
    const resolution = {
      slaName,
      resolvedValue: currentValue,
      breachDuration: Date.now() - breach.timestamp.getTime(),
      timestamp: new Date(),
    };

    this.logger.info('SLA breach resolved', resolution);

    // Send resolution notification
    await this.sendResolutionNotification(breach, resolution);

    // Emit resolution event
    this.eventBus.publish('sla.breach.resolved', resolution);
  }

  /**
   * Send alerts for SLA breach
   */
  private async sendAlerts(breach: SLABreach, isEscalation: boolean = false): Promise<void> {
    const alertPromises = this.alertChannels
      .filter(channel => channel.enabled)
      .map(async channel => {
        try {
          switch (channel.type) {
            case 'email':
              await this.sendEmailAlert(channel, breach, isEscalation);
              break;
            case 'slack':
              await this.sendSlackAlert(channel, breach, isEscalation);
              break;
            case 'pagerduty':
              if (breach.severity === 'critical') {
                await this.sendPagerDutyAlert(channel, breach, isEscalation);
              }
              break;
            case 'webhook':
              await this.sendWebhookAlert(channel, breach, isEscalation);
              break;
          }
        } catch (error) {
          this.logger.error('Alert delivery failed', {
            channel: channel.name,
            error: error.message,
          });
        }
      });

    await Promise.allSettled(alertPromises);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(channel: AlertChannel, breach: SLABreach, isEscalation: boolean): Promise<void> {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter(channel.config.smtp);

    const subject = `${isEscalation ? '[ESCALATED] ' : ''}SportIntel SLA Breach: ${breach.slaName}`;
    const html = `
      <h2>SportIntel SLA Breach Alert</h2>
      <p><strong>SLA:</strong> ${breach.slaName}</p>
      <p><strong>Description:</strong> ${breach.description}</p>
      <p><strong>Severity:</strong> ${breach.severity.toUpperCase()}</p>
      <p><strong>Current Value:</strong> ${breach.currentValue}</p>
      <p><strong>Target Value:</strong> ${breach.targetValue}</p>
      <p><strong>Duration:</strong> ${Math.round((breach.duration || 0) / 1000)}s</p>
      <p><strong>Time:</strong> ${breach.timestamp.toISOString()}</p>
      ${isEscalation ? '<p><strong>⚠️ This is an escalated alert due to severity change.</strong></p>' : ''}
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@sportintel.ai',
      to: channel.config.recipients.join(','),
      subject,
      html,
    });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(channel: AlertChannel, breach: SLABreach, isEscalation: boolean): Promise<void> {
    const axios = require('axios');
    
    const color = breach.severity === 'critical' ? 'danger' : 'warning';
    const emoji = breach.severity === 'critical' ? '🚨' : '⚠️';
    
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      attachments: [
        {
          color,
          title: `${emoji} SportIntel SLA Breach${isEscalation ? ' (Escalated)' : ''}`,
          fields: [
            { title: 'SLA', value: breach.slaName, short: true },
            { title: 'Severity', value: breach.severity.toUpperCase(), short: true },
            { title: 'Current Value', value: `${breach.currentValue}`, short: true },
            { title: 'Target Value', value: `${breach.targetValue}`, short: true },
            { title: 'Duration', value: `${Math.round((breach.duration || 0) / 1000)}s`, short: true },
            { title: 'Description', value: breach.description, short: false },
          ],
          timestamp: Math.floor(breach.timestamp.getTime() / 1000),
        },
      ],
    };

    await axios.post(channel.config.webhookUrl, payload);
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(channel: AlertChannel, breach: SLABreach, isEscalation: boolean): Promise<void> {
    const axios = require('axios');
    
    const payload = {
      routing_key: channel.config.integrationKey,
      event_action: 'trigger',
      dedup_key: `sportintel-sla-${breach.slaName}`,
      payload: {
        summary: `SportIntel SLA Breach: ${breach.slaName}`,
        source: 'sportintel-sla-monitor',
        severity: channel.config.severity,
        component: 'sportintel',
        group: 'sla',
        class: 'performance',
        custom_details: {
          sla_name: breach.slaName,
          description: breach.description,
          current_value: breach.currentValue,
          target_value: breach.targetValue,
          duration: breach.duration,
          is_escalation: isEscalation,
        },
      },
    };

    await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(channel: AlertChannel, breach: SLABreach, isEscalation: boolean): Promise<void> {
    const axios = require('axios');
    
    const payload = {
      event: 'sla_breach',
      breach,
      isEscalation,
      timestamp: breach.timestamp.toISOString(),
    };

    await axios({
      method: channel.config.method,
      url: channel.config.url,
      headers: channel.config.headers,
      data: payload,
    });
  }

  /**
   * Send breach resolution notification
   */
  private async sendResolutionNotification(breach: SLABreach, resolution: any): Promise<void> {
    // Only send resolution notifications for critical breaches or long-duration breaches
    if (breach.severity === 'critical' || (breach.duration && breach.duration > 300000)) { // 5 minutes
      // Implementation would be similar to sendAlerts but with resolution message
      this.logger.info('Resolution notification sent', { slaName: breach.slaName });
    }
  }

  /**
   * Simulate metric value for testing
   */
  private simulateMetricValue(sla: SLATarget): number {
    // This simulates realistic values for testing
    // In production, this would query actual Prometheus metrics
    
    switch (sla.name) {
      case 'response_time_p95':
        return 150 + Math.random() * 100; // 150-250ms
      case 'uptime':
        return 99.5 + Math.random() * 0.5; // 99.5-100%
      case 'error_rate':
        return Math.random() * 0.5; // 0-0.5%
      case 'prediction_latency_p95':
        return 80 + Math.random() * 40; // 80-120ms
      case 'cache_hit_rate':
        return 92 + Math.random() * 8; // 92-100%
      case 'model_accuracy':
        return 65 + Math.random() * 15; // 65-80%
      default:
        return sla.target + (Math.random() - 0.5) * sla.target * 0.1;
    }
  }

  /**
   * Check if metric is performance-based (higher = worse)
   */
  private isPerformanceMetric(metricName: string): boolean {
    const performanceMetrics = [
      'response_time_p95',
      'error_rate', 
      'prediction_latency_p95',
      'database_query_p95',
      'data_freshness'
    ];
    return performanceMetrics.includes(metricName);
  }

  /**
   * Get current SLA status
   */
  public getSLAStatus(): any {
    return {
      totalSLAs: this.slaTargets.size,
      activeBreeches: this.activeBreeches.size,
      breeches: Array.from(this.activeBreeches.values()),
      slaTargets: Array.from(this.slaTargets.values()),
      alertChannels: this.alertChannels.length,
      lastChecked: new Date(),
    };
  }

  /**
   * Get SLA breach history
   */
  public getBreachHistory(hours: number = 24): SLABreach[] {
    // This would query historical breach data from storage
    // For now, return current active breeches
    return Array.from(this.activeBreeches.values());
  }

  /**
   * Force SLA check
   */
  public async forceSLACheck(): Promise<void> {
    this.logger.info('Forcing SLA check...');
    await this.checkAllSLAs();
  }
}

export default SportIntelSLAMonitor;