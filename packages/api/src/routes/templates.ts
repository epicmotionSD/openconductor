// Template API Routes - Factory Layer
// Endpoints for template management, hydration, and deployment

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { TemplateService } from '../services/template-service';
import { TemplateHydrationService, HydrationInput } from '../services/template-hydration-service';

const router = Router();

// Services store
let templateService: TemplateService;
let hydrationService: TemplateHydrationService;

// Initialize services
function initializeServices(pool: Pool) {
  templateService = TemplateService.getInstance(pool);
  hydrationService = TemplateHydrationService.getInstance(pool);
}

// Create routes with database pool
export function createTemplateRoutes(pool: Pool): Router {
  initializeServices(pool);

  // ============================================
  // TEMPLATE RETRIEVAL ENDPOINTS
  // ============================================

  /**
   * GET /templates
   * List all templates
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const templates = await templateService.getAllTemplates();

      res.json({
        success: true,
        data: {
          templates,
          count: templates.length
        }
      });
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /templates/:id
   * Get template by ID (T01-T10)
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const template = await templateService.getTemplateById(req.params.id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: { message: `Template ${req.params.id} not found` }
        });
      }

      // Include component schema
      const schema = templateService.getComponentSchema(req.params.id);

      res.json({
        success: true,
        data: {
          template,
          schema
        }
      });
    } catch (error: any) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /templates/intent/:intent
   * Get templates by intent type
   */
  router.get('/intent/:intent', async (req: Request, res: Response) => {
    try {
      const intent = req.params.intent as any;
      const validIntents = ['transactional', 'informational', 'commercial', 'navigational'];

      if (!validIntents.includes(intent)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid intent. Must be one of: ${validIntents.join(', ')}` }
        });
      }

      const templates = await templateService.getTemplatesByIntent(intent);

      res.json({
        success: true,
        data: {
          intent,
          templates,
          count: templates.length
        }
      });
    } catch (error: any) {
      console.error('Error fetching templates by intent:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // TEMPLATE RECOMMENDATION ENDPOINTS
  // ============================================

  /**
   * POST /templates/recommend
   * Get template recommendations for a keyword
   */
  router.post('/recommend', async (req: Request, res: Response) => {
    try {
      const { keyword, intent, characteristics } = req.body;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: { message: 'Keyword is required' }
        });
      }

      const recommendations = await templateService.recommendTemplate(
        keyword,
        intent,
        characteristics
      );

      res.json({
        success: true,
        data: {
          keyword,
          recommendations: recommendations.slice(0, 5), // Top 5
          topRecommendation: recommendations[0] || null
        }
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // HYDRATION ENDPOINTS
  // ============================================

  /**
   * POST /templates/:id/hydrate
   * Hydrate a template with content
   */
  router.post('/:id/hydrate', async (req: Request, res: Response) => {
    try {
      const templateId = req.params.id;
      const { content, options } = req.body;

      if (!content || typeof content !== 'object') {
        return res.status(400).json({
          success: false,
          error: { message: 'Content object is required' }
        });
      }

      const input: HydrationInput = {
        templateId,
        content,
        options: options || {
          seoOptimized: true,
          includeSchema: true
        }
      };

      const result = await hydrationService.hydrate(input);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error hydrating template:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /templates/:id/preview
   * Generate preview HTML only (lightweight)
   */
  router.post('/:id/preview', async (req: Request, res: Response) => {
    try {
      const templateId = req.params.id;
      const { content, options } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: { message: 'Content is required' }
        });
      }

      const input: HydrationInput = {
        templateId,
        content,
        options: {
          ...options,
          includeSchema: false,
          includeAnalytics: false
        }
      };

      const result = await hydrationService.hydrate(input);

      // Return only preview-relevant data
      res.json({
        success: true,
        data: {
          html: result.content.html,
          css: result.content.css,
          validation: result.validation,
          seo: result.seo,
          estimatedLoadTime: result.estimatedLoadTime
        }
      });
    } catch (error: any) {
      console.error('Error generating preview:', error);
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
   * POST /templates/:id/deploy
   * Deploy a hydrated template
   */
  router.post('/:id/deploy', async (req: Request, res: Response) => {
    try {
      const templateId = req.params.id;
      const {
        content,
        targetKeyword,
        targetUrl,
        triggeredBy = 'human',
        options
      } = req.body;

      if (!content || !targetKeyword) {
        return res.status(400).json({
          success: false,
          error: { message: 'Content and targetKeyword are required' }
        });
      }

      // Hydrate the template
      const hydrationResult = await hydrationService.hydrate({
        templateId,
        content,
        options: {
          targetKeyword,
          seoOptimized: true,
          includeSchema: true,
          includeAnalytics: true,
          ...options
        }
      });

      if (!hydrationResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Template validation failed',
            validation: hydrationResult.validation
          }
        });
      }

      // Record deployment
      const deploymentId = await templateService.recordDeployment(
        templateId,
        targetKeyword,
        targetUrl || `/${targetKeyword.toLowerCase().replace(/\s+/g, '-')}`,
        triggeredBy
      );

      // Update deployment status to building
      await templateService.updateDeploymentStatus(deploymentId, 'building');

      res.json({
        success: true,
        data: {
          deploymentId,
          templateId,
          targetKeyword,
          status: 'building',
          content: hydrationResult.content,
          seo: hydrationResult.seo,
          message: 'Deployment initiated. Content is being built.'
        }
      });
    } catch (error: any) {
      console.error('Error deploying template:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /templates/deployments
   * Get recent deployments
   */
  router.get('/deployments/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const deployments = await templateService.getRecentDeployments(limit);

      res.json({
        success: true,
        data: {
          deployments,
          count: deployments.length
        }
      });
    } catch (error: any) {
      console.error('Error fetching deployments:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * PATCH /templates/deployments/:id/status
   * Update deployment status
   */
  router.patch('/deployments/:id/status', async (req: Request, res: Response) => {
    try {
      const deploymentId = req.params.id;
      const { status, liveUrl, previewUrl, error, vercelId } = req.body;

      const validStatuses = ['building', 'deploying', 'live', 'failed', 'rolled_back'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }
        });
      }

      await templateService.updateDeploymentStatus(deploymentId, status, {
        liveUrl,
        previewUrl,
        error,
        vercelId
      });

      res.json({
        success: true,
        data: { message: `Deployment status updated to ${status}` }
      });
    } catch (error: any) {
      console.error('Error updating deployment status:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // SCHEMA ENDPOINTS
  // ============================================

  /**
   * GET /templates/:id/schema
   * Get component schema for a template
   */
  router.get('/:id/schema', async (req: Request, res: Response) => {
    try {
      const templateId = req.params.id;
      const schema = templateService.getComponentSchema(templateId);

      if (!schema) {
        return res.status(404).json({
          success: false,
          error: { message: `Schema for template ${templateId} not found` }
        });
      }

      res.json({
        success: true,
        data: { templateId, schema }
      });
    } catch (error: any) {
      console.error('Error fetching schema:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // KELATI-SPECIFIC ENDPOINTS
  // ============================================

  /**
   * GET /templates/kelati/recommended
   * Get Kelati-specific template recommendations
   */
  router.get('/kelati/recommended', async (req: Request, res: Response) => {
    try {
      const kelatiKeywords = [
        'sisterlocks houston',
        'microlocs houston',
        'loc maintenance houston',
        'loctician houston'
      ];

      const recommendations: Record<string, any> = {};

      for (const keyword of kelatiKeywords) {
        const recs = await templateService.recommendTemplate(keyword, undefined, {
          hasLocation: true,
          needsBooking: true
        });
        recommendations[keyword] = recs.slice(0, 3);
      }

      res.json({
        success: true,
        data: {
          business: 'Kelati',
          recommendations,
          suggestedTemplates: ['T01', 'T02', 'T07', 'T05'] // Converter, Booking, Local, Comparison
        }
      });
    } catch (error: any) {
      console.error('Error fetching Kelati recommendations:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /templates/kelati/generate-geo-pages
   * Generate local geo pages for Kelati (Houston neighborhoods)
   */
  router.post('/kelati/generate-geo-pages', async (req: Request, res: Response) => {
    try {
      const {
        service = 'sisterlocks',
        neighborhoods = ['Katy', 'Sugar Land', 'Pearland', 'Cypress', 'The Woodlands', 'Humble']
      } = req.body;

      const generatedPages: any[] = [];

      for (const neighborhood of neighborhoods) {
        const content = {
          city: 'Houston',
          neighborhood,
          service: `${service.charAt(0).toUpperCase()}${service.slice(1)}`,
          businessName: 'Kelati Natural Hair',
          address: '1234 Main St, Houston, TX 77001', // Would be replaced with real address
          phone: '(713) 555-0123',
          mapEmbedUrl: 'https://maps.google.com/...',
          services: [service, 'loc maintenance', 'loc repair', 'consultations']
        };

        const hydrationResult = await hydrationService.hydrate({
          templateId: 'T07',
          content,
          options: {
            targetKeyword: `${service} ${neighborhood.toLowerCase()} tx`,
            businessName: 'Kelati Natural Hair',
            seoOptimized: true,
            includeSchema: true
          }
        });

        generatedPages.push({
          neighborhood,
          keyword: `${service} ${neighborhood.toLowerCase()}`,
          validation: hydrationResult.validation,
          seo: hydrationResult.seo,
          ready: hydrationResult.success
        });
      }

      res.json({
        success: true,
        data: {
          service,
          generatedPages,
          readyCount: generatedPages.filter(p => p.ready).length,
          totalCount: generatedPages.length
        }
      });
    } catch (error: any) {
      console.error('Error generating geo pages:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  return router;
}

export default createTemplateRoutes;
