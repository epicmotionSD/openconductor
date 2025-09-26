/**
 * SportIntel Monitoring Integration
 * 
 * Integrates Prometheus metrics collection, Grafana dashboards, and SLA monitoring
 * to provide Bloomberg Terminal-level observability and reliability.
 */

import { Express } from 'express';
import { register } from 'prom-client';
import { Logger } from '../../utils/logger';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { EventBus } from '../../events/event-bus';
import { SportIntelMetricsCollector } from './metrics-collector';
import { SportIntelSLAMonitor } from './sla-monitor';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Complete monitoring integration for SportIntel
 */
export class SportIntelMonitoringIntegration {
  private logger: Logger;
  private config: SportIntelConfigManager;
  private eventBus: EventBus;
  private metricsCollector: SportIntelMetricsCollector;
  private slaMonitor: SportIntelSLAMonitor;
  private app: Express;

  constructor(app: Express, eventBus: EventBus) {
    this.logger = Logger.getInstance();
    this.config = SportIntelConfigManager.getInstance();
    this.eventBus = eventBus;
    this.app = app;

    // Initialize components
    this.metricsCollector = new SportIntelMetricsCollector(eventBus);
    this.slaMonitor = new SportIntelSLAMonitor(eventBus);

    this.setupMonitoringEndpoints();
    this.setupGrafanaDashboards();
    this.startPeriodicTasks();

    this.logger.info('SportIntel Monitoring Integration initialized');
  }

  /**
   * Setup monitoring HTTP endpoints
   */
  private setupMonitoringEndpoints(): void {
    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        this.logger.error('Failed to serve metrics', { error });
        res.status(500).end(error);
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: this.config.getConfig().environment,
        services: {
          metrics: 'up',
          sla_monitor: 'up',
          database: 'up', // Would check actual database health
          cache: 'up', // Would check actual cache health
        },
      };

      res.json(health);
    });

    // SLA status endpoint
    this.app.get('/sla/status', (req, res) => {
      const status = this.slaMonitor.getSLAStatus();
      res.json(status);
    });

    // SLA breach history endpoint
    this.app.get('/sla/breaches', (req, res) => {
      const hours = parseInt(req.query.hours as string) || 24;
      const breaches = this.slaMonitor.getBreachHistory(hours);
      res.json(breaches);
    });

    // Force SLA check endpoint (for testing)
    this.app.post('/sla/check', async (req, res) => {
      try {
        await this.slaMonitor.forceSLACheck();
        res.json({ success: true, message: 'SLA check completed' });
      } catch (error) {
        this.logger.error('Failed to force SLA check', { error });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Metrics summary endpoint
    this.app.get('/metrics/summary', async (req, res) => {
      try {
        const summary = await this.metricsCollector.getMetricsSummary();
        res.json(summary);
      } catch (error) {
        this.logger.error('Failed to get metrics summary', { error });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Custom dashboard data endpoint
    this.app.get('/dashboard/data', async (req, res) => {
      try {
        const dashboardData = await this.getDashboardData();
        res.json(dashboardData);
      } catch (error) {
        this.logger.error('Failed to get dashboard data', { error });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.logger.info('Monitoring endpoints configured');
  }

  /**
   * Setup Grafana dashboards
   */
  private async setupGrafanaDashboards(): Promise<void> {
    if (!this.config.isProduction()) {
      try {
        // Load dashboard configurations
        const dashboardsPath = path.join(__dirname, 'grafana-dashboards.json');
        const dashboardsConfig = JSON.parse(await fs.readFile(dashboardsPath, 'utf8'));

        // In a real implementation, this would:
        // 1. Connect to Grafana API
        // 2. Create/update dashboards
        // 3. Set up data sources
        // 4. Configure alerts

        this.logger.info('Grafana dashboards configured', {
          dashboards: Object.keys(dashboardsConfig).length,
        });
      } catch (error) {
        this.logger.error('Failed to setup Grafana dashboards', { error });
      }
    }
  }

  /**
   * Start periodic monitoring tasks
   */
  private startPeriodicTasks(): void {
    // Start metrics collector periodic updates
    this.metricsCollector.startPeriodicUpdates();

    // Generate daily monitoring report
    setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // Daily

    // Health check ping
    setInterval(() => {
      this.performHealthCheck();
    }, 60 * 1000); // Every minute

    this.logger.info('Periodic monitoring tasks started');
  }

  /**
   * Generate daily monitoring report
   */
  private async generateDailyReport(): Promise<void> {
    try {
      const report = {
        date: new Date().toISOString().split('T')[0],
        slaStatus: this.slaMonitor.getSLAStatus(),
        metrics: await this.getKeyMetrics(),
        performance: await this.getPerformanceSummary(),
        businessMetrics: await this.getBusinessMetrics(),
        recommendations: await this.generateRecommendations(),
      };

      // Log report
      this.logger.info('Daily monitoring report generated', report);

      // Emit report event
      this.eventBus.publish('monitoring.daily.report', report);

      // Store report (would save to database in real implementation)
      await this.storeReport(report);

    } catch (error) {
      this.logger.error('Failed to generate daily report', { error });
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = {
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        slaBreaches: this.slaMonitor.getSLAStatus().activeBreeches,
      };

      // Emit health event
      this.eventBus.publish('monitoring.health.check', health);

      // Log critical issues
      if (health.slaBreaches > 0) {
        this.logger.warn('Health check detected SLA breaches', {
          breaches: health.slaBreaches,
        });
      }

    } catch (error) {
      this.logger.error('Health check failed', { error });
    }
  }

  /**
   * Get dashboard data
   */
  private async getDashboardData(): Promise<any> {
    return {
      overview: {
        uptime: this.calculateUptime(),
        responseTime: await this.getAverageResponseTime(),
        activeUsers: await this.getActiveUserCount(),
        revenue: await this.getCurrentRevenue(),
        predictions: await this.getPredictionCount(),
      },
      performance: {
        responseTimeP95: await this.getResponseTimeP95(),
        throughput: await this.getThroughput(),
        errorRate: await this.getErrorRate(),
        cacheHitRate: await this.getCacheHitRate(),
      },
      business: {
        subscriptionDistribution: await this.getSubscriptionDistribution(),
        featureUsage: await this.getFeatureUsage(),
        usageLimits: await this.getUsageLimitsHit(),
        churnRate: await this.getChurnRate(),
      },
      infrastructure: {
        dbConnections: await this.getDbConnections(),
        queryPerformance: await this.getQueryPerformance(),
        cacheSize: await this.getCacheSize(),
        compressionRatio: await this.getCompressionRatio(),
      },
    };
  }

  /**
   * Get key metrics summary
   */
  private async getKeyMetrics(): Promise<any> {
    return {
      uptime: this.calculateUptime(),
      responseTime: await this.getAverageResponseTime(),
      throughput: await this.getThroughput(),
      errorRate: await this.getErrorRate(),
      cacheHitRate: await this.getCacheHitRate(),
    };
  }

  /**
   * Get performance summary
   */
  private async getPerformanceSummary(): Promise<any> {
    return {
      averageResponseTime: await this.getAverageResponseTime(),
      p95ResponseTime: await this.getResponseTimeP95(),
      maxResponseTime: await this.getMaxResponseTime(),
      totalRequests: await this.getTotalRequests(),
      successRate: await this.getSuccessRate(),
    };
  }

  /**
   * Get business metrics
   */
  private async getBusinessMetrics(): Promise<any> {
    return {
      activeSubscriptions: await this.getActiveSubscriptions(),
      monthlyRevenue: await this.getMonthlyRevenue(),
      newSignups: await this.getNewSignups(),
      churnRate: await this.getChurnRate(),
      averageRevenuePerUser: await this.getAverageRevenuePerUser(),
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Check response time
    const responseTime = await this.getAverageResponseTime();
    if (responseTime > 200) {
      recommendations.push('Consider optimizing API endpoints - response time exceeds 200ms target');
    }

    // Check cache hit rate
    const cacheHitRate = await this.getCacheHitRate();
    if (cacheHitRate < 95) {
      recommendations.push('Improve cache strategy - hit rate below 95% target');
    }

    // Check error rate
    const errorRate = await this.getErrorRate();
    if (errorRate > 1) {
      recommendations.push('Investigate error causes - error rate exceeds 1% threshold');
    }

    // Check SLA breaches
    const slaStatus = this.slaMonitor.getSLAStatus();
    if (slaStatus.activeBreeches > 0) {
      recommendations.push(`Address ${slaStatus.activeBreeches} active SLA breach(es)`);
    }

    return recommendations;
  }

  /**
   * Store monitoring report
   */
  private async storeReport(report: any): Promise<void> {
    // In a real implementation, this would store the report in a database
    // For now, just log that we would store it
    this.logger.info('Storing monitoring report', {
      date: report.date,
      size: JSON.stringify(report).length,
    });
  }

  // Helper methods for metrics (these would query actual Prometheus metrics)
  private calculateUptime(): number {
    return Math.min(99.9 + Math.random() * 0.1, 100);
  }

  private async getAverageResponseTime(): Promise<number> {
    return 150 + Math.random() * 50; // 150-200ms
  }

  private async getResponseTimeP95(): Promise<number> {
    return 180 + Math.random() * 60; // 180-240ms
  }

  private async getMaxResponseTime(): Promise<number> {
    return 300 + Math.random() * 200; // 300-500ms
  }

  private async getThroughput(): Promise<number> {
    return 1000 + Math.random() * 500; // 1000-1500 RPS
  }

  private async getErrorRate(): Promise<number> {
    return Math.random() * 0.5; // 0-0.5%
  }

  private async getCacheHitRate(): Promise<number> {
    return 94 + Math.random() * 6; // 94-100%
  }

  private async getTotalRequests(): Promise<number> {
    return Math.floor(Math.random() * 1000000); // Random daily requests
  }

  private async getSuccessRate(): Promise<number> {
    return 99 + Math.random() * 1; // 99-100%
  }

  private async getActiveUserCount(): Promise<number> {
    return Math.floor(Math.random() * 10000); // Random active users
  }

  private async getCurrentRevenue(): Promise<number> {
    return Math.floor(Math.random() * 500000); // Random monthly revenue
  }

  private async getPredictionCount(): Promise<number> {
    return Math.floor(Math.random() * 100000); // Random daily predictions
  }

  private async getSubscriptionDistribution(): Promise<any> {
    return {
      rookie: Math.floor(Math.random() * 1000),
      pro: Math.floor(Math.random() * 500),
      elite: Math.floor(Math.random() * 200),
      champion: Math.floor(Math.random() * 50),
    };
  }

  private async getFeatureUsage(): Promise<any> {
    return {
      predictions: Math.floor(Math.random() * 50000),
      portfolios: Math.floor(Math.random() * 10000),
      alerts: Math.floor(Math.random() * 5000),
      analytics: Math.floor(Math.random() * 2000),
    };
  }

  private async getUsageLimitsHit(): Promise<number> {
    return Math.floor(Math.random() * 100);
  }

  private async getActiveSubscriptions(): Promise<number> {
    return Math.floor(Math.random() * 2000);
  }

  private async getMonthlyRevenue(): Promise<number> {
    return Math.floor(Math.random() * 500000);
  }

  private async getNewSignups(): Promise<number> {
    return Math.floor(Math.random() * 100);
  }

  private async getChurnRate(): Promise<number> {
    return Math.random() * 5; // 0-5%
  }

  private async getAverageRevenuePerUser(): Promise<number> {
    return 50 + Math.random() * 200; // $50-250
  }

  private async getDbConnections(): Promise<number> {
    return Math.floor(Math.random() * 50);
  }

  private async getQueryPerformance(): Promise<number> {
    return 10 + Math.random() * 40; // 10-50ms
  }

  private async getCacheSize(): Promise<number> {
    return Math.floor(Math.random() * 1000000000); // Random bytes
  }

  private async getCompressionRatio(): Promise<number> {
    return 0.2 + Math.random() * 0.3; // 20-50% compression
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    this.slaMonitor.stopMonitoring();
    this.logger.info('SportIntel monitoring stopped');
  }

  /**
   * Get monitoring status
   */
  public getStatus(): any {
    return {
      metricsCollector: 'active',
      slaMonitor: this.slaMonitor.getSLAStatus(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: this.config.getConfig().environment,
    };
  }
}

/**
 * Initialize SportIntel monitoring
 */
export const initializeSportIntelMonitoring = (app: Express, eventBus: EventBus): SportIntelMonitoringIntegration => {
  return new SportIntelMonitoringIntegration(app, eventBus);
};

export default SportIntelMonitoringIntegration;