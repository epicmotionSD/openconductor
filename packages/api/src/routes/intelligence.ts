// Intelligence API Routes - Revenue Sniper
// Endpoints for trend analysis, ad bleed detection, and market intelligence

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { ApifyService } from '../services/apify-service';
import { TrendArbitrageService } from '../services/trend-arbitrage-service';
import { AdBleedDetectionService } from '../services/ad-bleed-detection-service';

const router = Router();

// Services store
let apifyService: ApifyService;
let trendService: TrendArbitrageService;
let adBleedService: AdBleedDetectionService;

// Initialize services
function initializeServices(pool: Pool) {
  apifyService = ApifyService.getInstance(pool);
  trendService = TrendArbitrageService.getInstance(pool, apifyService);
  adBleedService = AdBleedDetectionService.getInstance(pool, apifyService);
}

// Create routes with database pool
export function createIntelligenceRoutes(pool: Pool): Router {
  initializeServices(pool);

  // ============================================
  // HEALTH & STATUS ENDPOINTS
  // ============================================

  /**
   * GET /intelligence/health
   * Check Apify service health
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const health = await apifyService.healthCheck();

      res.json({
        success: true,
        data: {
          apify: health,
          services: {
            trends: true,
            adBleed: true,
            serp: true
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

  // ============================================
  // TREND ANALYSIS ENDPOINTS
  // ============================================

  /**
   * POST /intelligence/trends/analyze
   * Analyze trends for given keywords
   */
  router.post('/trends/analyze', async (req: Request, res: Response) => {
    try {
      const {
        keywords,
        geo = 'US-TX',
        timeframe = 'now 7-d',
        breakoutThreshold = 300,
        risingThreshold = 50,
        minVolume = 100
      } = req.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Keywords array is required' }
        });
      }

      const result = await trendService.analyzeTrends({
        seedKeywords: keywords,
        geo,
        timeframe,
        breakoutThreshold,
        risingThreshold,
        minVolume
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Trend analysis error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /intelligence/trends/kelati
   * Get Kelati-specific trend analysis
   */
  router.get('/trends/kelati', async (req: Request, res: Response) => {
    try {
      const result = await trendService.analyzeKelatiTrends();

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
   * GET /intelligence/trends/neighborhoods
   * Analyze Houston neighborhood trends for a service
   */
  router.get('/trends/neighborhoods', async (req: Request, res: Response) => {
    try {
      const service = req.query.service as string || 'sisterlocks';
      const signals = await trendService.analyzeHoustonNeighborhoods(service);

      res.json({
        success: true,
        data: {
          service,
          signals,
          count: signals.length
        }
      });
    } catch (error: any) {
      console.error('Neighborhood trend analysis error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /intelligence/trends/recent
   * Get recent trend signals
   */
  router.get('/trends/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const signals = await trendService.getRecentSignals(limit);

      res.json({
        success: true,
        data: {
          signals,
          count: signals.length
        }
      });
    } catch (error: any) {
      console.error('Error fetching recent trends:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /intelligence/trends/breakout
   * Get breakout trends (24h)
   */
  router.get('/trends/breakout', async (req: Request, res: Response) => {
    try {
      const signals = await trendService.getBreakoutTrends();

      res.json({
        success: true,
        data: {
          signals,
          count: signals.length
        }
      });
    } catch (error: any) {
      console.error('Error fetching breakout trends:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // AD BLEED DETECTION ENDPOINTS
  // ============================================

  /**
   * POST /intelligence/ad-bleed/scan
   * Scan keywords for ad bleed
   */
  router.post('/ad-bleed/scan', async (req: Request, res: Response) => {
    try {
      const { keywords, geo, adSpendData, organicRankings } = req.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Keywords array is required' }
        });
      }

      const result = await adBleedService.scanForAdBleed({
        keywords,
        geo,
        adSpendData,
        organicRankings
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Ad bleed scan error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /intelligence/ad-bleed/alerts
   * Get unresolved ad bleed alerts
   */
  router.get('/ad-bleed/alerts', async (req: Request, res: Response) => {
    try {
      const alerts = await adBleedService.getUnresolvedAlerts();

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          totalWasted: alerts.reduce((sum, a) => sum + a.wastedSpend, 0)
        }
      });
    } catch (error: any) {
      console.error('Error fetching ad bleed alerts:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /intelligence/ad-bleed/alerts/:id/resolve
   * Resolve an ad bleed alert
   */
  router.post('/ad-bleed/alerts/:id/resolve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resolvedBy = 'human' } = req.body;

      await adBleedService.resolveAlert(id, resolvedBy);

      res.json({
        success: true,
        data: { message: 'Alert resolved', id }
      });
    } catch (error: any) {
      console.error('Error resolving ad bleed alert:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /intelligence/ad-bleed/summary
   * Get ad bleed summary stats
   */
  router.get('/ad-bleed/summary', async (req: Request, res: Response) => {
    try {
      const [alerts, totalWasted7d, totalWasted30d] = await Promise.all([
        adBleedService.getUnresolvedAlerts(),
        adBleedService.getTotalWastedSpend('7d'),
        adBleedService.getTotalWastedSpend('30d')
      ]);

      // Group by type
      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};

      alerts.forEach(a => {
        byType[a.bleedType] = (byType[a.bleedType] || 0) + 1;
        bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totalAlerts: alerts.length,
          totalWasted7d,
          totalWasted30d,
          byType,
          bySeverity,
          criticalCount: bySeverity['critical'] || 0,
          highCount: bySeverity['high'] || 0
        }
      });
    } catch (error: any) {
      console.error('Error fetching ad bleed summary:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // SERP ANALYSIS ENDPOINTS
  // ============================================

  /**
   * POST /intelligence/serp/analyze
   * Analyze SERP for keywords
   */
  router.post('/serp/analyze', async (req: Request, res: Response) => {
    try {
      const { queries, geo, maxPages = 1 } = req.body;

      if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Queries array is required' }
        });
      }

      const results = await apifyService.scrapeGoogleSearch({
        queries,
        maxPagesPerQuery: maxPages,
        locationUule: geo ? apifyService.getLocationUule(geo, 'Texas') : undefined
      });

      res.json({
        success: true,
        data: {
          results,
          count: results.length
        }
      });
    } catch (error: any) {
      console.error('SERP analysis error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * GET /intelligence/serp/competitors
   * Get competitor analysis for a keyword
   */
  router.get('/serp/competitors', async (req: Request, res: Response) => {
    try {
      const keyword = req.query.keyword as string;
      const geo = req.query.geo as string || 'Houston';

      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: { message: 'Keyword is required' }
        });
      }

      const results = await apifyService.scrapeGoogleSearch({
        queries: [keyword],
        maxPagesPerQuery: 1,
        locationUule: apifyService.getLocationUule(geo, 'Texas')
      });

      const serpResult = results[0];

      if (!serpResult) {
        return res.status(404).json({
          success: false,
          error: { message: 'No SERP data found' }
        });
      }

      res.json({
        success: true,
        data: {
          keyword,
          geo,
          organicCompetitors: serpResult.organicResults.slice(0, 5),
          paidCompetitors: serpResult.paidResults,
          relatedSearches: serpResult.relatedSearches,
          peopleAlsoAsk: serpResult.peopleAlsoAsk
        }
      });
    } catch (error: any) {
      console.error('Competitor analysis error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  // ============================================
  // COMBINED INTELLIGENCE ENDPOINTS
  // ============================================

  /**
   * GET /intelligence/dashboard
   * Get combined intelligence for command center
   */
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const [
        recentTrends,
        breakoutTrends,
        adBleedAlerts,
        adBleedSummary
      ] = await Promise.all([
        trendService.getRecentSignals(10),
        trendService.getBreakoutTrends(),
        adBleedService.getUnresolvedAlerts(),
        adBleedService.getTotalWastedSpend('7d')
      ]);

      res.json({
        success: true,
        data: {
          trends: {
            recent: recentTrends,
            breakout: breakoutTrends,
            breakoutCount: breakoutTrends.length,
            risingCount: recentTrends.filter(t => t.category === 'rising').length
          },
          adBleed: {
            alerts: adBleedAlerts.slice(0, 5), // Top 5
            totalAlerts: adBleedAlerts.length,
            totalWasted: adBleedSummary
          },
          timestamp: new Date()
        }
      });
    } catch (error: any) {
      console.error('Dashboard intelligence error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  /**
   * POST /intelligence/full-scan
   * Run comprehensive intelligence scan
   */
  router.post('/full-scan', async (req: Request, res: Response) => {
    try {
      const { keywords, geo = 'US-TX', includeAdBleed = true } = req.body;

      // Default to Kelati keywords if none provided
      const targetKeywords = keywords || [
        'sisterlocks houston',
        'microlocs houston',
        'loc maintenance houston',
        'loctician near me'
      ];

      // Run trend analysis
      const trendResult = await trendService.analyzeTrends({
        seedKeywords: targetKeywords,
        geo,
        timeframe: 'now 7-d',
        breakoutThreshold: 200,
        risingThreshold: 30,
        minVolume: 50
      });

      // Run ad bleed scan if requested
      let adBleedResult = null;
      if (includeAdBleed) {
        adBleedResult = await adBleedService.scanForAdBleed({
          keywords: targetKeywords,
          geo
        });
      }

      res.json({
        success: true,
        data: {
          trends: trendResult,
          adBleed: adBleedResult,
          scannedAt: new Date()
        }
      });
    } catch (error: any) {
      console.error('Full scan error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  });

  return router;
}

export default createIntelligenceRoutes;
