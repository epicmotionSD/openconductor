// Ad Bleed Detection Service - Revenue Sniper
// Identifies and flags wasted ad spend across campaigns

import { Pool } from 'pg';
import { ApifyService, GoogleSearchResult } from './apify-service';

// Types
export type AdBleedType =
  | 'intent_mismatch'      // Informational keyword with transactional ad
  | 'cannibalization'      // Paid ad competing with top organic ranking
  | 'dead_trend'           // High spend on declining keyword
  | 'negative_keyword'     // Low-intent traffic leakage
  | 'competitor_gap';      // Missing keyword where competitor appears

export type BleedSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AdBleedAlert {
  id: string;
  bleedType: AdBleedType;
  keyword: string;
  severity: BleedSeverity;
  wastedSpend: number;
  wastedSpendPeriod: string;
  currentCpc: number;
  conversionRate: number;
  organicRank?: number;
  competitorPresent?: boolean;
  recommendation: string;
  autoFixAvailable: boolean;
  detectedAt: Date;
}

export interface CannibalizationCheck {
  keyword: string;
  organicRank: number;
  paidPosition: number;
  hasCompetitorAds: boolean;
  estimatedWaste: number;
}

export interface IntentMismatchCheck {
  keyword: string;
  detectedIntent: 'informational' | 'transactional' | 'commercial' | 'navigational';
  adIntent: string;
  conversionRate: number;
  estimatedWaste: number;
}

export interface AdBleedScanConfig {
  keywords: string[];
  geo?: string;
  adSpendData?: Array<{
    keyword: string;
    spend: number;
    clicks: number;
    conversions: number;
    cpc: number;
  }>;
  organicRankings?: Array<{
    keyword: string;
    position: number;
  }>;
}

export interface AdBleedScanResult {
  alerts: AdBleedAlert[];
  totalWasted: number;
  wastedPercentage: number;
  alertsByType: Record<AdBleedType, number>;
  recommendations: string[];
  scannedAt: Date;
}

export class AdBleedDetectionService {
  private static instance: AdBleedDetectionService;
  private pool: Pool;
  private apifyService: ApifyService;

  // Intent detection patterns
  private readonly INFORMATIONAL_PATTERNS = [
    'how to', 'what is', 'what are', 'why', 'when', 'guide', 'tutorial',
    'tips', 'ideas', 'examples', 'vs', 'difference', 'compare'
  ];

  private readonly LOW_INTENT_PATTERNS = [
    'free', 'cheap', 'diy', 'at home', 'yourself', 'tutorial',
    'training', 'class', 'course', 'school', 'certification'
  ];

  private constructor(pool: Pool, apifyService: ApifyService) {
    this.pool = pool;
    this.apifyService = apifyService;
  }

  static getInstance(pool: Pool, apifyService: ApifyService): AdBleedDetectionService {
    if (!AdBleedDetectionService.instance) {
      AdBleedDetectionService.instance = new AdBleedDetectionService(pool, apifyService);
    }
    return AdBleedDetectionService.instance;
  }

  // ============================================
  // MAIN SCAN METHODS
  // ============================================

  /**
   * Perform comprehensive ad bleed scan
   */
  async scanForAdBleed(config: AdBleedScanConfig): Promise<AdBleedScanResult> {
    const { keywords, geo, adSpendData, organicRankings } = config;
    const alerts: AdBleedAlert[] = [];
    let totalSpend = 0;

    // Get SERP data for keywords
    const serpData = await this.apifyService.scrapeGoogleSearch({
      queries: keywords,
      maxPagesPerQuery: 1,
      resultsPerPage: 10,
      locationUule: geo ? this.apifyService.getLocationUule(geo, 'Texas') : undefined
    });

    // Analyze each keyword
    for (const keyword of keywords) {
      const serpResult = serpData.find(s => s.query.toLowerCase() === keyword.toLowerCase());
      const spendData = adSpendData?.find(s => s.keyword.toLowerCase() === keyword.toLowerCase());
      const organicRank = organicRankings?.find(r => r.keyword.toLowerCase() === keyword.toLowerCase())?.position;

      if (spendData) {
        totalSpend += spendData.spend;
      }

      // Check for cannibalization
      const cannibalization = await this.checkCannibalization(
        keyword,
        serpResult,
        organicRank,
        spendData
      );
      if (cannibalization) {
        alerts.push(cannibalization);
      }

      // Check for intent mismatch
      const intentMismatch = await this.checkIntentMismatch(
        keyword,
        serpResult,
        spendData
      );
      if (intentMismatch) {
        alerts.push(intentMismatch);
      }

      // Check for negative keyword opportunities
      const negativeKeyword = await this.checkNegativeKeyword(
        keyword,
        spendData
      );
      if (negativeKeyword) {
        alerts.push(negativeKeyword);
      }

      // Check for competitor gaps
      const competitorGap = await this.checkCompetitorGap(
        keyword,
        serpResult
      );
      if (competitorGap) {
        alerts.push(competitorGap);
      }
    }

    // Calculate totals
    const totalWasted = alerts.reduce((sum, a) => sum + a.wastedSpend, 0);
    const wastedPercentage = totalSpend > 0 ? (totalWasted / totalSpend) * 100 : 0;

    // Group by type
    const alertsByType: Record<AdBleedType, number> = {
      intent_mismatch: 0,
      cannibalization: 0,
      dead_trend: 0,
      negative_keyword: 0,
      competitor_gap: 0
    };
    alerts.forEach(a => alertsByType[a.bleedType]++);

    // Generate recommendations
    const recommendations = this.generateRecommendations(alerts, alertsByType);

    // Store alerts in database
    await this.storeAlerts(alerts);

    return {
      alerts,
      totalWasted,
      wastedPercentage,
      alertsByType,
      recommendations,
      scannedAt: new Date()
    };
  }

  // ============================================
  // DETECTION METHODS
  // ============================================

  /**
   * Check for keyword cannibalization
   */
  private async checkCannibalization(
    keyword: string,
    serpResult?: GoogleSearchResult,
    organicRank?: number,
    spendData?: any
  ): Promise<AdBleedAlert | null> {
    // Need both organic rank and SERP data
    if (!serpResult || organicRank === undefined) {
      return null;
    }

    // If ranking in top 3 organically and no competitor ads, it's cannibalization
    if (organicRank <= 3) {
      const hasCompetitorAds = serpResult.paidResults.length > 0;

      if (!hasCompetitorAds) {
        const wastedSpend = spendData ? spendData.spend * 0.8 : 50; // 80% of spend is wasted

        return {
          id: this.generateAlertId(),
          bleedType: 'cannibalization',
          keyword,
          severity: wastedSpend > 100 ? 'high' : 'medium',
          wastedSpend,
          wastedSpendPeriod: '7d',
          currentCpc: spendData?.cpc || 2.0,
          conversionRate: spendData ? (spendData.conversions / spendData.clicks) * 100 : 2.0,
          organicRank,
          competitorPresent: false,
          recommendation: `Pause ad - already ranking #${organicRank} organically with no competitor ads`,
          autoFixAvailable: true,
          detectedAt: new Date()
        };
      }
    }

    return null;
  }

  /**
   * Check for intent mismatch
   */
  private async checkIntentMismatch(
    keyword: string,
    serpResult?: GoogleSearchResult,
    spendData?: any
  ): Promise<AdBleedAlert | null> {
    const lowerKeyword = keyword.toLowerCase();

    // Check if keyword has informational intent
    const isInformational = this.INFORMATIONAL_PATTERNS.some(p =>
      lowerKeyword.includes(p)
    );

    if (isInformational && spendData) {
      // Low conversion rate confirms mismatch
      const conversionRate = spendData.clicks > 0
        ? (spendData.conversions / spendData.clicks) * 100
        : 0;

      if (conversionRate < 1) {
        const wastedSpend = spendData.spend * 0.9; // 90% wasted

        return {
          id: this.generateAlertId(),
          bleedType: 'intent_mismatch',
          keyword,
          severity: wastedSpend > 50 ? 'high' : 'medium',
          wastedSpend,
          wastedSpendPeriod: '7d',
          currentCpc: spendData.cpc,
          conversionRate,
          recommendation: 'Add to negative keywords - informational intent detected',
          autoFixAvailable: true,
          detectedAt: new Date()
        };
      }
    }

    return null;
  }

  /**
   * Check for negative keyword opportunities
   */
  private async checkNegativeKeyword(
    keyword: string,
    spendData?: any
  ): Promise<AdBleedAlert | null> {
    const lowerKeyword = keyword.toLowerCase();

    // Check for low-intent patterns
    const hasLowIntentPattern = this.LOW_INTENT_PATTERNS.some(p =>
      lowerKeyword.includes(p)
    );

    if (hasLowIntentPattern && spendData) {
      const conversionRate = spendData.clicks > 0
        ? (spendData.conversions / spendData.clicks) * 100
        : 0;

      if (conversionRate < 0.5) {
        // Find which pattern matched
        const matchedPattern = this.LOW_INTENT_PATTERNS.find(p =>
          lowerKeyword.includes(p)
        );

        return {
          id: this.generateAlertId(),
          bleedType: 'negative_keyword',
          keyword,
          severity: 'low',
          wastedSpend: spendData.spend,
          wastedSpendPeriod: '7d',
          currentCpc: spendData.cpc,
          conversionRate,
          recommendation: `Add "${matchedPattern}" to negative keyword list`,
          autoFixAvailable: true,
          detectedAt: new Date()
        };
      }
    }

    return null;
  }

  /**
   * Check for competitor gaps (where competitors appear but we don't)
   */
  private async checkCompetitorGap(
    keyword: string,
    serpResult?: GoogleSearchResult
  ): Promise<AdBleedAlert | null> {
    if (!serpResult) return null;

    // If there are competitor ads but we're not in paid results
    // (This would require knowing our ads, for now we flag any high-value keywords)
    const hasCompetitorAds = serpResult.paidResults.length > 0;

    if (hasCompetitorAds) {
      // Check if this is a high-value commercial keyword
      const isCommercial = this.isCommercialKeyword(keyword);

      if (isCommercial) {
        return {
          id: this.generateAlertId(),
          bleedType: 'competitor_gap',
          keyword,
          severity: 'medium',
          wastedSpend: 0, // Opportunity cost, not wasted
          wastedSpendPeriod: '7d',
          currentCpc: 0,
          conversionRate: 0,
          competitorPresent: true,
          recommendation: `Competitors bidding on "${keyword}" - consider launching campaign`,
          autoFixAvailable: false,
          detectedAt: new Date()
        };
      }
    }

    return null;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isCommercialKeyword(keyword: string): boolean {
    const commercialIndicators = [
      'price', 'cost', 'near me', 'book', 'appointment',
      'service', 'buy', 'shop', 'best', 'top'
    ];

    const lower = keyword.toLowerCase();
    return commercialIndicators.some(i => lower.includes(i));
  }

  private generateRecommendations(
    alerts: AdBleedAlert[],
    alertsByType: Record<AdBleedType, number>
  ): string[] {
    const recommendations: string[] = [];

    if (alertsByType.cannibalization > 0) {
      recommendations.push(
        `Pause ${alertsByType.cannibalization} branded/high-ranking keyword ads to stop cannibalization`
      );
    }

    if (alertsByType.intent_mismatch > 0) {
      recommendations.push(
        `Add ${alertsByType.intent_mismatch} informational keywords to negative list`
      );
    }

    if (alertsByType.negative_keyword > 0) {
      const patterns = [...new Set(alerts
        .filter(a => a.bleedType === 'negative_keyword')
        .map(a => a.recommendation.match(/"([^"]+)"/)?.[1])
        .filter(Boolean)
      )];
      recommendations.push(
        `Add negative keywords: ${patterns.join(', ')}`
      );
    }

    if (alertsByType.competitor_gap > 0) {
      recommendations.push(
        `Review ${alertsByType.competitor_gap} keywords where competitors are advertising`
      );
    }

    return recommendations;
  }

  private generateAlertId(): string {
    return `bleed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // DATABASE METHODS
  // ============================================

  private async storeAlerts(alerts: AdBleedAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        await this.pool.query(`
          INSERT INTO ad_bleed_alerts (
            bleed_type, keyword, severity, wasted_spend, wasted_spend_period,
            current_cpc, conversion_rate, organic_rank, recommendation,
            auto_fix_available, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          alert.bleedType,
          alert.keyword,
          alert.severity,
          alert.wastedSpend,
          alert.wastedSpendPeriod,
          alert.currentCpc,
          alert.conversionRate,
          alert.organicRank,
          alert.recommendation,
          alert.autoFixAvailable,
          alert.detectedAt
        ]);
      } catch (error) {
        console.error('Error storing ad bleed alert:', error);
      }
    }
  }

  /**
   * Get unresolved alerts from database
   */
  async getUnresolvedAlerts(): Promise<AdBleedAlert[]> {
    const result = await this.pool.query(`
      SELECT
        id, bleed_type, keyword, severity, wasted_spend, wasted_spend_period,
        current_cpc, conversion_rate, organic_rank, recommendation,
        auto_fix_available, created_at
      FROM ad_bleed_alerts
      WHERE resolved = FALSE
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        wasted_spend DESC
    `);

    return result.rows.map(row => ({
      id: row.id,
      bleedType: row.bleed_type,
      keyword: row.keyword,
      severity: row.severity,
      wastedSpend: parseFloat(row.wasted_spend),
      wastedSpendPeriod: row.wasted_spend_period,
      currentCpc: parseFloat(row.current_cpc),
      conversionRate: parseFloat(row.conversion_rate),
      organicRank: row.organic_rank,
      recommendation: row.recommendation,
      autoFixAvailable: row.auto_fix_available,
      detectedAt: row.created_at
    }));
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await this.pool.query(`
      UPDATE ad_bleed_alerts
      SET resolved = TRUE, resolved_at = NOW(), resolved_by = $2
      WHERE id = $1
    `, [alertId, resolvedBy]);
  }

  /**
   * Get total wasted spend
   */
  async getTotalWastedSpend(period: string = '7d'): Promise<number> {
    const result = await this.pool.query(`
      SELECT COALESCE(SUM(wasted_spend), 0) as total
      FROM ad_bleed_alerts
      WHERE resolved = FALSE
        AND wasted_spend_period = $1
    `, [period]);

    return parseFloat(result.rows[0]?.total) || 0;
  }
}

export default AdBleedDetectionService;
