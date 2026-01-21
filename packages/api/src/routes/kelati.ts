// Kelati API Routes - First Revenue Application
// Endpoints for Kelati Natural Hair salon configuration and deployment

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { KelatiConfigService, KELATI_CONFIG } from '../services/kelati-config-service';
import { VercelDeployService } from '../services/vercel-deploy-service';
import { RevenueGateService } from '../services/revenue-gate-service';

const router = Router();

// Services store
let kelatiService: KelatiConfigService;
let deployService: VercelDeployService;
let revenueGateService: RevenueGateService;

// Initialize services
function initializeServices(pool: Pool) {
  kelatiService = KelatiConfigService.getInstance(pool);
  deployService = VercelDeployService.getInstance(pool);
  revenueGateService = RevenueGateService.getInstance(pool);
}

// Create routes with database pool
export function createKelatiRoutes(pool: Pool): Router {
  initializeServices(pool);

  // ============================================
  // CONFIGURATION ENDPOINTS
  // ============================================

  /**
   * GET /kelati/config
   * Get Kelati business configuration
   */
  router.get('/config', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: {
          business: KELATI_CONFIG.business,
          services: KELATI_CONFIG.services,
          serviceAreas: KELATI_CONFIG.serviceAreas,
          branding: KELATI_CONFIG.branding,
          templateMapping: KELATI_CONFIG.templateMapping
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /kelati/keywords
   * Get Kelati seed keywords for trend monitoring
   */
  router.get('/keywords', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: {
          keywords: KELATI_CONFIG.seedKeywords,
          totalKeywords:
            KELATI_CONFIG.seedKeywords.primary.length +
            KELATI_CONFIG.seedKeywords.secondary.length +
            KELATI_CONFIG.seedKeywords.informational.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /kelati/services
   * Get Kelati services list
   */
  router.get('/services', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: {
          services: KELATI_CONFIG.services,
          serviceAreas: KELATI_CONFIG.serviceAreas
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // PAGE GENERATION ENDPOINTS
  // ============================================

  /**
   * GET /kelati/pages
   * Get all generated page configurations
   */
  router.get('/pages', async (req: Request, res: Response) => {
    try {
      const pages = kelatiService.generateAllPageConfigs();

      res.json({
        success: true,
        data: {
          pages,
          totalPages: pages.length,
          byPriority: {
            high: pages.filter(p => p.priority === 1).length,
            medium: pages.filter(p => p.priority === 2).length,
            low: pages.filter(p => p.priority >= 3).length
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /kelati/pages/:type
   * Get page configurations by type
   */
  router.get('/pages/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type as 'landing' | 'geo' | 'comparison' | 'educational' | 'specialty';
      const validTypes = ['landing', 'geo', 'comparison', 'educational', 'specialty'];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid page type. Must be one of: ${validTypes.join(', ')}` }
        });
      }

      let pages;
      switch (type) {
        case 'landing':
          pages = kelatiService['generateServiceLandingPages']();
          break;
        case 'geo':
          pages = kelatiService['generateGeoPages']();
          break;
        case 'comparison':
          pages = kelatiService['generateComparisonPages']();
          break;
        case 'educational':
          pages = kelatiService['generateEducationalPages']();
          break;
        case 'specialty':
          pages = kelatiService['generateSpecialtyPages']();
          break;
        default:
          pages = [];
      }

      res.json({
        success: true,
        data: {
          type,
          pages,
          count: pages.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // DEPLOYMENT ENDPOINTS
  // ============================================

  /**
   * POST /kelati/deploy
   * Deploy all Kelati pages
   */
  router.post('/deploy', async (req: Request, res: Response) => {
    try {
      const { dryRun = false, priority } = req.body;

      if (dryRun) {
        const pages = kelatiService.generateAllPageConfigs();
        const filtered = priority
          ? pages.filter(p => p.priority <= priority)
          : pages;

        return res.json({
          success: true,
          data: {
            dryRun: true,
            pagesToDeploy: filtered.length,
            pages: filtered.map(p => ({
              slug: p.slug,
              keyword: p.targetKeyword,
              templateId: p.templateId,
              priority: p.priority
            }))
          }
        });
      }

      const result = await kelatiService.deployAllPages();

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Kelati deployment error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /kelati/deploy/:type
   * Deploy specific page type
   */
  router.post('/deploy/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type as 'landing' | 'geo' | 'comparison' | 'educational' | 'specialty';
      const validTypes = ['landing', 'geo', 'comparison', 'educational', 'specialty'];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid page type. Must be one of: ${validTypes.join(', ')}` }
        });
      }

      const results = await kelatiService.deployPageType(type);

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      res.json({
        success: true,
        data: {
          type,
          totalDeployed: results.length,
          successCount,
          failedCount,
          results
        }
      });
    } catch (error: any) {
      console.error(`Kelati ${req.params.type} deployment error:`, error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /kelati/deploy/single
   * Deploy a single page by slug
   */
  router.post('/deploy/single', async (req: Request, res: Response) => {
    try {
      const { slug, skipGate = false } = req.body;

      if (!slug) {
        return res.status(400).json({
          success: false,
          error: { message: 'Slug is required' }
        });
      }

      // Find the page config
      const allPages = kelatiService.generateAllPageConfigs();
      const page = allPages.find(p => p.slug === slug);

      if (!page) {
        return res.status(404).json({
          success: false,
          error: { message: `Page with slug "${slug}" not found` }
        });
      }

      // Validate with revenue gate (unless skipped)
      if (!skipGate) {
        const gateResult = await revenueGateService.validateDeployment({
          templateId: page.templateId,
          targetKeyword: page.targetKeyword,
          targetUrl: `/${page.slug}`,
          content: page.content
        });

        if (!gateResult.approved) {
          return res.json({
            success: false,
            data: {
              gateResult,
              message: 'Deployment blocked by revenue gate validation'
            }
          });
        }
      }

      // Deploy
      const result = await deployService.deploy({
        templateId: page.templateId,
        targetKeyword: page.targetKeyword,
        content: page.content,
        slug: page.slug,
        production: true,
        skipGate
      });

      res.json({
        success: result.success,
        data: result
      });
    } catch (error: any) {
      console.error('Single page deployment error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // TREND ANALYSIS ENDPOINTS
  // ============================================

  /**
   * GET /kelati/trends
   * Analyze trends for Kelati keywords
   */
  router.get('/trends', async (req: Request, res: Response) => {
    try {
      const result = await kelatiService.analyzeKelatiTrends();

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Kelati trend analysis error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /kelati/opportunities
   * Get trending opportunities for Kelati
   */
  router.get('/opportunities', async (req: Request, res: Response) => {
    try {
      const opportunities = await kelatiService.getTrendingOpportunities();

      res.json({
        success: true,
        data: {
          ...opportunities,
          breakoutCount: opportunities.breakout.length,
          risingCount: opportunities.rising.length
        }
      });
    } catch (error: any) {
      console.error('Kelati opportunities error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // REVENUE GATE VALIDATION
  // ============================================

  /**
   * POST /kelati/validate
   * Validate a Kelati page before deployment
   */
  router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { slug } = req.body;

      if (!slug) {
        return res.status(400).json({
          success: false,
          error: { message: 'Slug is required' }
        });
      }

      // Find the page config
      const allPages = kelatiService.generateAllPageConfigs();
      const page = allPages.find(p => p.slug === slug);

      if (!page) {
        return res.status(404).json({
          success: false,
          error: { message: `Page with slug "${slug}" not found` }
        });
      }

      // Run validation
      const gateResult = await revenueGateService.validateDeployment({
        templateId: page.templateId,
        targetKeyword: page.targetKeyword,
        targetUrl: `/${page.slug}`,
        content: page.content
      });

      res.json({
        success: true,
        data: {
          page: {
            slug: page.slug,
            keyword: page.targetKeyword,
            templateId: page.templateId
          },
          validation: gateResult
        }
      });
    } catch (error: any) {
      console.error('Kelati validation error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // DASHBOARD ENDPOINT
  // ============================================

  /**
   * GET /kelati/dashboard
   * Get Kelati command center dashboard data
   */
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      // Get page configs
      const allPages = kelatiService.generateAllPageConfigs();

      // Get recent deployments for Kelati
      const deploymentsResult = await pool.query(`
        SELECT *
        FROM deployments
        WHERE target_keyword ILIKE '%sisterlocks%'
           OR target_keyword ILIKE '%microlocs%'
           OR target_keyword ILIKE '%kelati%'
           OR target_keyword ILIKE '%loc%houston%'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // Get trend opportunities
      let opportunities = { breakout: [], rising: [], recommendations: [] };
      try {
        opportunities = await kelatiService.getTrendingOpportunities();
      } catch (e) {
        // Trends may not be available without Apify token
      }

      res.json({
        success: true,
        data: {
          business: {
            name: KELATI_CONFIG.business.name,
            website: KELATI_CONFIG.business.website,
            bookingUrl: KELATI_CONFIG.business.bookingUrl
          },
          pageStats: {
            totalConfigured: allPages.length,
            byType: {
              landing: allPages.filter(p => p.templateId === 'T01').length,
              geo: allPages.filter(p => p.templateId === 'T07').length,
              comparison: allPages.filter(p => p.templateId === 'T05').length,
              educational: allPages.filter(p => p.templateId === 'T04').length,
              specialty: allPages.filter(p => !['T01', 'T07', 'T05', 'T04'].includes(p.templateId)).length
            },
            highPriority: allPages.filter(p => p.priority === 1).length
          },
          recentDeployments: deploymentsResult.rows,
          opportunities: {
            breakoutCount: opportunities.breakout.length,
            risingCount: opportunities.rising.length,
            topRecommendations: opportunities.recommendations.slice(0, 3)
          },
          services: KELATI_CONFIG.services.length,
          serviceAreas: KELATI_CONFIG.serviceAreas.length
        }
      });
    } catch (error: any) {
      console.error('Kelati dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  return router;
}

export default createKelatiRoutes;
