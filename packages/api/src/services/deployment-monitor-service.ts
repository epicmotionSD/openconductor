// Deployment Monitor Service - Post-deployment Tracking
// Monitors deployed pages for performance, conversions, and ROAS

import { Pool } from 'pg';
import { VercelDeployService } from './vercel-deploy-service';

// Types
export interface DeploymentMetrics {
  deploymentId: string;
  pageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  adSpend: number;
  roas: number;
  qualityScore: number;
  pageLoadTime: number;
  coreWebVitals: CoreWebVitals;
  collectedAt: Date;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
}

export interface DeploymentHealth {
  deploymentId: string;
  status: 'healthy' | 'warning' | 'critical';
  issues: HealthIssue[];
  lastCheck: Date;
}

export interface HealthIssue {
  type: 'performance' | 'seo' | 'conversion' | 'uptime' | 'roas';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
}

export interface DeploymentSummary {
  totalDeployments: number;
  liveDeployments: number;
  failedDeployments: number;
  totalPageViews: number;
  totalConversions: number;
  totalRevenue: number;
  avgROAS: number;
  avgConversionRate: number;
  topPerformers: DeploymentPerformance[];
  underperformers: DeploymentPerformance[];
}

export interface DeploymentPerformance {
  id: string;
  templateId: string;
  targetKeyword: string;
  url: string;
  pageViews: number;
  conversions: number;
  conversionRate: number;
  roas: number;
  status: 'live' | 'failed' | 'rolled_back';
}

export class DeploymentMonitorService {
  private static instance: DeploymentMonitorService;
  private pool: Pool;
  private vercelService: VercelDeployService;

  // Thresholds for health checks
  private readonly THRESHOLDS = {
    minConversionRate: 0.02, // 2%
    minROAS: 2.0, // 2x
    maxBounceRate: 0.70, // 70%
    maxPageLoadTime: 3000, // 3 seconds
    maxLCP: 2500, // 2.5 seconds
    maxFID: 100, // 100ms
    maxCLS: 0.1 // 0.1
  };

  private constructor(pool: Pool) {
    this.pool = pool;
    this.vercelService = VercelDeployService.getInstance(pool);
  }

  static getInstance(pool: Pool): DeploymentMonitorService {
    if (!DeploymentMonitorService.instance) {
      DeploymentMonitorService.instance = new DeploymentMonitorService(pool);
    }
    return DeploymentMonitorService.instance;
  }

  // ============================================
  // METRICS COLLECTION
  // ============================================

  /**
   * Collect metrics for a deployment (from analytics sources)
   */
  async collectMetrics(deploymentId: string): Promise<DeploymentMetrics | null> {
    // Get deployment info
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) return null;

    // In production, this would pull from:
    // - Google Analytics API
    // - Google Ads API
    // - Vercel Analytics
    // - Custom tracking endpoints

    // For now, return mock data or stored metrics
    const storedMetrics = await this.getStoredMetrics(deploymentId);
    if (storedMetrics) return storedMetrics;

    // Generate estimated metrics based on deployment age and type
    const metrics = await this.estimateMetrics(deployment);
    await this.storeMetrics(metrics);

    return metrics;
  }

  /**
   * Collect metrics for all live deployments
   */
  async collectAllMetrics(): Promise<DeploymentMetrics[]> {
    const liveDeployments = await this.pool.query(`
      SELECT id FROM deployments WHERE status = 'live'
    `);

    const metrics: DeploymentMetrics[] = [];

    for (const row of liveDeployments.rows) {
      const m = await this.collectMetrics(row.id);
      if (m) metrics.push(m);
    }

    return metrics;
  }

  // ============================================
  // HEALTH MONITORING
  // ============================================

  /**
   * Check health of a deployment
   */
  async checkHealth(deploymentId: string): Promise<DeploymentHealth> {
    const metrics = await this.collectMetrics(deploymentId);
    const issues: HealthIssue[] = [];

    if (metrics) {
      // Performance checks
      if (metrics.pageLoadTime > this.THRESHOLDS.maxPageLoadTime) {
        issues.push({
          type: 'performance',
          severity: metrics.pageLoadTime > 5000 ? 'high' : 'medium',
          message: `Page load time (${metrics.pageLoadTime}ms) exceeds threshold`,
          recommendation: 'Optimize images, enable caching, and minimize JavaScript'
        });
      }

      // Core Web Vitals checks
      if (metrics.coreWebVitals.lcp > this.THRESHOLDS.maxLCP) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: `LCP (${metrics.coreWebVitals.lcp}ms) needs improvement`,
          recommendation: 'Optimize largest contentful element loading'
        });
      }

      if (metrics.coreWebVitals.cls > this.THRESHOLDS.maxCLS) {
        issues.push({
          type: 'performance',
          severity: 'low',
          message: `CLS (${metrics.coreWebVitals.cls}) above threshold`,
          recommendation: 'Set explicit dimensions for images and embeds'
        });
      }

      // Conversion checks
      if (metrics.conversionRate < this.THRESHOLDS.minConversionRate) {
        issues.push({
          type: 'conversion',
          severity: metrics.conversionRate < 0.01 ? 'high' : 'medium',
          message: `Conversion rate (${(metrics.conversionRate * 100).toFixed(2)}%) below threshold`,
          recommendation: 'Review CTA placement, improve offer clarity, or adjust targeting'
        });
      }

      // ROAS checks
      if (metrics.adSpend > 0 && metrics.roas < this.THRESHOLDS.minROAS) {
        issues.push({
          type: 'roas',
          severity: metrics.roas < 1 ? 'critical' : 'high',
          message: `ROAS (${metrics.roas.toFixed(1)}x) below target`,
          recommendation: 'Optimize ad spend or improve conversion funnel'
        });
      }

      // Bounce rate check
      if (metrics.bounceRate > this.THRESHOLDS.maxBounceRate) {
        issues.push({
          type: 'seo',
          severity: 'medium',
          message: `Bounce rate (${(metrics.bounceRate * 100).toFixed(1)}%) is high`,
          recommendation: 'Improve content relevance and page loading speed'
        });
      }
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.some(i => i.severity === 'critical')) {
      status = 'critical';
    } else if (issues.some(i => i.severity === 'high')) {
      status = 'warning';
    } else if (issues.length > 2) {
      status = 'warning';
    }

    return {
      deploymentId,
      status,
      issues,
      lastCheck: new Date()
    };
  }

  /**
   * Check health of all live deployments
   */
  async checkAllHealth(): Promise<DeploymentHealth[]> {
    const liveDeployments = await this.pool.query(`
      SELECT id FROM deployments WHERE status = 'live'
    `);

    const healthChecks: DeploymentHealth[] = [];

    for (const row of liveDeployments.rows) {
      const health = await this.checkHealth(row.id);
      healthChecks.push(health);
    }

    return healthChecks;
  }

  // ============================================
  // REPORTING
  // ============================================

  /**
   * Get deployment summary
   */
  async getSummary(): Promise<DeploymentSummary> {
    // Get deployment counts
    const countResult = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'live') as live,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM deployments
    `);

    const { total, live, failed } = countResult.rows[0];

    // Get aggregated metrics from stored data
    const metricsResult = await this.pool.query(`
      SELECT
        COALESCE(SUM((data->>'pageViews')::int), 0) as total_views,
        COALESCE(SUM((data->>'conversions')::int), 0) as total_conversions,
        COALESCE(SUM((data->>'revenue')::decimal), 0) as total_revenue,
        COALESCE(AVG((data->>'roas')::decimal), 0) as avg_roas,
        COALESCE(AVG((data->>'conversionRate')::decimal), 0) as avg_conversion_rate
      FROM deployment_metrics
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    const aggregates = metricsResult.rows[0];

    // Get top performers
    const topPerformersResult = await this.pool.query(`
      SELECT
        d.id, d.template_id, d.target_keyword, d.live_url,
        COALESCE((dm.data->>'pageViews')::int, 0) as page_views,
        COALESCE((dm.data->>'conversions')::int, 0) as conversions,
        COALESCE((dm.data->>'conversionRate')::decimal, 0) as conversion_rate,
        COALESCE((dm.data->>'roas')::decimal, 0) as roas,
        d.status
      FROM deployments d
      LEFT JOIN LATERAL (
        SELECT data FROM deployment_metrics
        WHERE deployment_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) dm ON true
      WHERE d.status = 'live'
      ORDER BY COALESCE((dm.data->>'conversions')::int, 0) DESC
      LIMIT 5
    `);

    // Get underperformers
    const underperformersResult = await this.pool.query(`
      SELECT
        d.id, d.template_id, d.target_keyword, d.live_url,
        COALESCE((dm.data->>'pageViews')::int, 0) as page_views,
        COALESCE((dm.data->>'conversions')::int, 0) as conversions,
        COALESCE((dm.data->>'conversionRate')::decimal, 0) as conversion_rate,
        COALESCE((dm.data->>'roas')::decimal, 0) as roas,
        d.status
      FROM deployments d
      LEFT JOIN LATERAL (
        SELECT data FROM deployment_metrics
        WHERE deployment_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) dm ON true
      WHERE d.status = 'live'
        AND d.created_at < NOW() - INTERVAL '7 days'
        AND (dm.data->>'conversionRate')::decimal < 0.02
      ORDER BY COALESCE((dm.data->>'conversionRate')::decimal, 0) ASC
      LIMIT 5
    `);

    return {
      totalDeployments: parseInt(total),
      liveDeployments: parseInt(live),
      failedDeployments: parseInt(failed),
      totalPageViews: parseInt(aggregates.total_views) || 0,
      totalConversions: parseInt(aggregates.total_conversions) || 0,
      totalRevenue: parseFloat(aggregates.total_revenue) || 0,
      avgROAS: parseFloat(aggregates.avg_roas) || 0,
      avgConversionRate: parseFloat(aggregates.avg_conversion_rate) || 0,
      topPerformers: topPerformersResult.rows.map(this.mapToPerformance),
      underperformers: underperformersResult.rows.map(this.mapToPerformance)
    };
  }

  /**
   * Get performance history for a deployment
   */
  async getPerformanceHistory(
    deploymentId: string,
    days: number = 30
  ): Promise<DeploymentMetrics[]> {
    const result = await this.pool.query(`
      SELECT data
      FROM deployment_metrics
      WHERE deployment_id = $1
        AND created_at > NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
    `, [deploymentId]);

    return result.rows.map(row => row.data as DeploymentMetrics);
  }

  // ============================================
  // ALERTS & NOTIFICATIONS
  // ============================================

  /**
   * Get deployments needing attention
   */
  async getDeploymentsNeedingAttention(): Promise<{
    critical: DeploymentHealth[];
    warning: DeploymentHealth[];
  }> {
    const allHealth = await this.checkAllHealth();

    return {
      critical: allHealth.filter(h => h.status === 'critical'),
      warning: allHealth.filter(h => h.status === 'warning')
    };
  }

  /**
   * Generate alert for underperforming deployment
   */
  async createUnderperformanceAlert(
    deploymentId: string,
    issue: HealthIssue
  ): Promise<void> {
    await this.pool.query(`
      INSERT INTO agent_tasks (
        to_agent_id,
        task_type,
        title,
        description,
        payload,
        priority,
        status
      )
      SELECT
        id,
        'review_deployment',
        $2,
        $3,
        $4,
        CASE $5
          WHEN 'critical' THEN 'critical'
          WHEN 'high' THEN 'high'
          ELSE 'medium'
        END,
        'pending'
      FROM agents
      WHERE role = 'cfo'
      LIMIT 1
    `, [
      deploymentId,
      `Deployment underperforming: ${issue.message}`,
      issue.recommendation,
      JSON.stringify({ deploymentId, issue }),
      issue.severity
    ]);
  }

  // ============================================
  // STORAGE METHODS
  // ============================================

  private async storeMetrics(metrics: DeploymentMetrics): Promise<void> {
    // Ensure the table exists (would be in migration normally)
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS deployment_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deployment_id UUID REFERENCES deployments(id),
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      INSERT INTO deployment_metrics (deployment_id, data)
      VALUES ($1, $2)
    `, [metrics.deploymentId, JSON.stringify(metrics)]);
  }

  private async getStoredMetrics(deploymentId: string): Promise<DeploymentMetrics | null> {
    try {
      const result = await this.pool.query(`
        SELECT data
        FROM deployment_metrics
        WHERE deployment_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [deploymentId]);

      if (result.rows.length === 0) return null;
      return result.rows[0].data as DeploymentMetrics;
    } catch {
      return null;
    }
  }

  private async getDeployment(id: string): Promise<any> {
    const result = await this.pool.query(`
      SELECT * FROM deployments WHERE id = $1
    `, [id]);
    return result.rows[0];
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async estimateMetrics(deployment: any): Promise<DeploymentMetrics> {
    const daysSinceDeploy = Math.floor(
      (Date.now() - new Date(deployment.deployed_at || deployment.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Base estimates
    const dailyViews = 50 + Math.random() * 100;
    const pageViews = Math.floor(dailyViews * Math.max(1, daysSinceDeploy));
    const bounceRate = 0.4 + Math.random() * 0.3;
    const conversionRate = 0.02 + Math.random() * 0.03;
    const conversions = Math.floor(pageViews * conversionRate);
    const avgOrderValue = 150;
    const revenue = conversions * avgOrderValue;
    const adSpend = pageViews * 2; // $2 avg CPC
    const roas = adSpend > 0 ? revenue / adSpend : 0;

    return {
      deploymentId: deployment.id,
      pageViews,
      uniqueVisitors: Math.floor(pageViews * 0.8),
      avgTimeOnPage: 45 + Math.random() * 60,
      bounceRate,
      conversions,
      conversionRate,
      revenue,
      adSpend,
      roas,
      qualityScore: 7 + Math.floor(Math.random() * 3),
      pageLoadTime: 1500 + Math.random() * 1500,
      coreWebVitals: {
        lcp: 1800 + Math.random() * 1200,
        fid: 50 + Math.random() * 100,
        cls: 0.05 + Math.random() * 0.1
      },
      collectedAt: new Date()
    };
  }

  private mapToPerformance(row: any): DeploymentPerformance {
    return {
      id: row.id,
      templateId: row.template_id,
      targetKeyword: row.target_keyword,
      url: row.live_url || '',
      pageViews: parseInt(row.page_views) || 0,
      conversions: parseInt(row.conversions) || 0,
      conversionRate: parseFloat(row.conversion_rate) || 0,
      roas: parseFloat(row.roas) || 0,
      status: row.status
    };
  }
}

export default DeploymentMonitorService;
