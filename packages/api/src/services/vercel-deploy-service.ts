// Vercel Deploy Service - Automated Deployment Pipeline
// Deploys hydrated templates to Vercel for instant landing pages

import { Pool } from 'pg';
import { TemplateService } from './template-service';
import { TemplateHydrationService, HydratedContent } from './template-hydration-service';
import { RevenueGateService } from './revenue-gate-service';

// Types
export interface VercelConfig {
  token: string;
  teamId?: string;
  projectId?: string;
}

export interface DeploymentRequest {
  templateId: string;
  targetKeyword: string;
  content: Record<string, any>;
  slug?: string;
  branch?: string;
  production?: boolean;
  skipGate?: boolean;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  internalId: string; // Our database ID
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  previewUrl?: string;
  liveUrl?: string;
  buildLogs?: string;
  error?: string;
  gateResult?: any;
  timestamp: Date;
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  meta?: Record<string, any>;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
}

export interface DeploymentFile {
  file: string;
  data: string;
  encoding?: 'utf-8' | 'base64';
}

export class VercelDeployService {
  private static instance: VercelDeployService;
  private pool: Pool;
  private config: VercelConfig;
  private templateService: TemplateService;
  private hydrationService: TemplateHydrationService;
  private revenueGateService: RevenueGateService;
  private baseUrl = 'https://api.vercel.com';

  private constructor(pool: Pool, config?: VercelConfig) {
    this.pool = pool;
    this.config = config || {
      token: process.env.VERCEL_TOKEN || '',
      teamId: process.env.VERCEL_TEAM_ID,
      projectId: process.env.VERCEL_PROJECT_ID
    };
    this.templateService = TemplateService.getInstance(pool);
    this.hydrationService = TemplateHydrationService.getInstance(pool);
    this.revenueGateService = RevenueGateService.getInstance(pool);
  }

  static getInstance(pool: Pool, config?: VercelConfig): VercelDeployService {
    if (!VercelDeployService.instance) {
      VercelDeployService.instance = new VercelDeployService(pool, config);
    }
    return VercelDeployService.instance;
  }

  // ============================================
  // MAIN DEPLOYMENT METHODS
  // ============================================

  /**
   * Deploy a template to Vercel
   */
  async deploy(request: DeploymentRequest): Promise<DeploymentResult> {
    const {
      templateId,
      targetKeyword,
      content,
      slug,
      branch = 'main',
      production = false,
      skipGate = false
    } = request;

    const internalId = await this.createInternalDeployment(templateId, targetKeyword, slug);

    try {
      // 1. Revenue Gate Validation (unless skipped)
      let gateResult = null;
      if (!skipGate) {
        gateResult = await this.revenueGateService.validateDeployment({
          templateId,
          targetKeyword,
          targetUrl: slug || this.generateSlug(targetKeyword),
          content
        });

        if (!gateResult.approved) {
          await this.updateDeploymentStatus(internalId, 'failed', {
            error: `Revenue gate blocked: ${gateResult.blockers.join(', ')}`
          });

          return {
            success: false,
            deploymentId: '',
            internalId,
            status: 'failed',
            error: `Revenue gate validation failed. Score: ${gateResult.score}/100. Blockers: ${gateResult.blockers.join(', ')}`,
            gateResult,
            timestamp: new Date()
          };
        }
      }

      // 2. Hydrate the template
      await this.updateDeploymentStatus(internalId, 'building');

      const hydrationResult = await this.hydrationService.hydrate({
        templateId,
        content,
        options: {
          targetKeyword,
          seoOptimized: true,
          includeSchema: true,
          includeAnalytics: true,
          analyticsId: process.env.GA_TRACKING_ID
        }
      });

      if (!hydrationResult.success) {
        await this.updateDeploymentStatus(internalId, 'failed', {
          error: `Hydration failed: ${hydrationResult.validation.errors.join(', ')}`
        });

        return {
          success: false,
          deploymentId: '',
          internalId,
          status: 'failed',
          error: `Template hydration failed: ${hydrationResult.validation.errors.join(', ')}`,
          gateResult,
          timestamp: new Date()
        };
      }

      // 3. Prepare deployment files
      const files = this.prepareDeploymentFiles(
        hydrationResult.content,
        slug || this.generateSlug(targetKeyword)
      );

      // 4. Deploy to Vercel
      await this.updateDeploymentStatus(internalId, 'deploying');

      const vercelDeployment = await this.createVercelDeployment(files, {
        name: slug || this.generateSlug(targetKeyword),
        target: production ? 'production' : undefined,
        meta: {
          templateId,
          targetKeyword,
          internalId
        }
      });

      // 5. Update our database with Vercel deployment info
      await this.updateDeploymentStatus(internalId, 'live', {
        vercelId: vercelDeployment.id,
        previewUrl: `https://${vercelDeployment.url}`,
        liveUrl: production ? `https://${slug || this.generateSlug(targetKeyword)}.vercel.app` : undefined
      });

      return {
        success: true,
        deploymentId: vercelDeployment.id,
        internalId,
        status: 'live',
        previewUrl: `https://${vercelDeployment.url}`,
        liveUrl: production ? `https://${slug || this.generateSlug(targetKeyword)}.vercel.app` : undefined,
        gateResult,
        timestamp: new Date()
      };

    } catch (error: any) {
      await this.updateDeploymentStatus(internalId, 'failed', {
        error: error.message
      });

      return {
        success: false,
        deploymentId: '',
        internalId,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Deploy multiple pages (batch deployment)
   */
  async deployBatch(requests: DeploymentRequest[]): Promise<DeploymentResult[]> {
    const results: DeploymentResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.deploy(request);
        results.push(result);

        // Small delay between deployments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.push({
          success: false,
          deploymentId: '',
          internalId: '',
          status: 'failed',
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  // ============================================
  // VERCEL API METHODS
  // ============================================

  /**
   * Create a deployment on Vercel
   */
  private async createVercelDeployment(
    files: DeploymentFile[],
    options: {
      name: string;
      target?: 'production';
      meta?: Record<string, any>;
    }
  ): Promise<VercelDeployment> {
    const endpoint = this.config.teamId
      ? `${this.baseUrl}/v13/deployments?teamId=${this.config.teamId}`
      : `${this.baseUrl}/v13/deployments`;

    const body = {
      name: options.name,
      files: files.map(f => ({
        file: f.file,
        data: f.data,
        encoding: f.encoding || 'utf-8'
      })),
      target: options.target,
      projectSettings: {
        framework: null, // Static site
        buildCommand: null,
        outputDirectory: null
      },
      meta: options.meta
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel deployment failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get deployment status from Vercel
   */
  async getVercelDeploymentStatus(deploymentId: string): Promise<VercelDeployment> {
    const endpoint = this.config.teamId
      ? `${this.baseUrl}/v13/deployments/${deploymentId}?teamId=${this.config.teamId}`
      : `${this.baseUrl}/v13/deployments/${deploymentId}`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get deployment status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete a Vercel deployment (rollback)
   */
  async deleteVercelDeployment(deploymentId: string): Promise<void> {
    const endpoint = this.config.teamId
      ? `${this.baseUrl}/v13/deployments/${deploymentId}?teamId=${this.config.teamId}`
      : `${this.baseUrl}/v13/deployments/${deploymentId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete deployment: ${response.status}`);
    }
  }

  // ============================================
  // FILE PREPARATION
  // ============================================

  /**
   * Prepare deployment files from hydrated content
   */
  private prepareDeploymentFiles(content: HydratedContent, slug: string): DeploymentFile[] {
    const files: DeploymentFile[] = [];

    // Index HTML
    files.push({
      file: 'index.html',
      data: content.html
    });

    // CSS file
    files.push({
      file: 'styles.css',
      data: content.css
    });

    // JSON-LD Schema (if present)
    if (content.schema) {
      // Schema is embedded in HTML, but we could also serve it separately
    }

    // Vercel config
    files.push({
      file: 'vercel.json',
      data: JSON.stringify({
        cleanUrls: true,
        trailingSlash: false,
        headers: [
          {
            source: '/(.*)',
            headers: [
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'X-XSS-Protection', value: '1; mode=block' }
            ]
          }
        ]
      }, null, 2)
    });

    // Robots.txt
    files.push({
      file: 'robots.txt',
      data: `User-agent: *
Allow: /

Sitemap: https://${slug}.vercel.app/sitemap.xml`
    });

    // Simple sitemap
    files.push({
      file: 'sitemap.xml',
      data: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${slug}.vercel.app/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    });

    return files;
  }

  // ============================================
  // DATABASE METHODS
  // ============================================

  /**
   * Create internal deployment record
   */
  private async createInternalDeployment(
    templateId: string,
    targetKeyword: string,
    slug?: string
  ): Promise<string> {
    const result = await this.pool.query(`
      INSERT INTO deployments (
        template_id, target_keyword, target_url, status, created_at
      ) VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING id
    `, [templateId, targetKeyword, slug || this.generateSlug(targetKeyword)]);

    return result.rows[0].id;
  }

  /**
   * Update deployment status
   */
  private async updateDeploymentStatus(
    id: string,
    status: 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back',
    details?: {
      vercelId?: string;
      previewUrl?: string;
      liveUrl?: string;
      error?: string;
    }
  ): Promise<void> {
    let query = `UPDATE deployments SET status = $1`;
    const params: any[] = [status];

    if (details?.vercelId) {
      params.push(details.vercelId);
      query += `, vercel_deployment_id = $${params.length}`;
    }
    if (details?.previewUrl) {
      params.push(details.previewUrl);
      query += `, preview_url = $${params.length}`;
    }
    if (details?.liveUrl) {
      params.push(details.liveUrl);
      query += `, live_url = $${params.length}`;
    }
    if (details?.error) {
      params.push(details.error);
      query += `, error = $${params.length}`;
    }
    if (status === 'live') {
      query += `, deployed_at = NOW()`;
    }
    if (status === 'rolled_back') {
      query += `, rolled_back_at = NOW()`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length}`;

    await this.pool.query(query, params);
  }

  /**
   * Rollback a deployment
   */
  async rollback(internalId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get deployment info
      const result = await this.pool.query(`
        SELECT vercel_deployment_id, status
        FROM deployments
        WHERE id = $1
      `, [internalId]);

      if (result.rows.length === 0) {
        return { success: false, message: 'Deployment not found' };
      }

      const { vercel_deployment_id, status } = result.rows[0];

      if (status !== 'live') {
        return { success: false, message: 'Can only rollback live deployments' };
      }

      if (vercel_deployment_id) {
        await this.deleteVercelDeployment(vercel_deployment_id);
      }

      await this.updateDeploymentStatus(internalId, 'rolled_back');

      return { success: true, message: 'Deployment rolled back successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private generateSlug(keyword: string): string {
    return keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Check if Vercel is properly configured
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.config.token) {
      return { healthy: false, message: 'VERCEL_TOKEN not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/user`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });

      if (!response.ok) {
        return { healthy: false, message: 'Invalid Vercel token' };
      }

      const user = await response.json();
      return {
        healthy: true,
        message: `Connected as: ${user.user?.username || 'unknown'}`
      };
    } catch (error: any) {
      return { healthy: false, message: error.message };
    }
  }
}

export default VercelDeployService;
