// Trend Arbitrage Service - Google Trends analysis for Revenue Sniper
// Detects rising and breakout keywords before competition

import { Pool } from 'pg';
import { ApifyService, GoogleTrendsResult } from './apify-service';

// Types
export type TrendCategory = 'breakout' | 'rising' | 'stable' | 'declining';
export type CompetitionLevel = 'low' | 'medium' | 'high' | 'saturated';
export type RecommendedAction = 'attack' | 'defend' | 'monitor' | 'ignore';

export interface TrendSignal {
  id: string;
  keyword: string;
  category: TrendCategory;
  growthRate: number;
  currentVolume: number;
  predictedVolume: number;
  competitionLevel: CompetitionLevel;
  recommendedAction: RecommendedAction;
  relatedKeywords: string[];
  geo: string;
  timeframe: string;
  confidence: number;
  detectedAt: Date;
}

export interface TrendAnalysisConfig {
  seedKeywords: string[];
  geo: string;
  timeframe: string;
  breakoutThreshold: number;  // Growth % to qualify as breakout (default: 300)
  risingThreshold: number;    // Growth % to qualify as rising (default: 50)
  minVolume: number;          // Minimum search volume to consider
}

export interface TrendAnalysisResult {
  signals: TrendSignal[];
  breakoutCount: number;
  risingCount: number;
  opportunities: TrendSignal[];
  analyzed: number;
  timestamp: Date;
}

export class TrendArbitrageService {
  private static instance: TrendArbitrageService;
  private pool: Pool;
  private apifyService: ApifyService;

  // Default thresholds
  private readonly BREAKOUT_THRESHOLD = 300;  // 300% growth
  private readonly RISING_THRESHOLD = 50;     // 50% growth
  private readonly MIN_VOLUME = 100;

  private constructor(pool: Pool, apifyService: ApifyService) {
    this.pool = pool;
    this.apifyService = apifyService;
  }

  static getInstance(pool: Pool, apifyService: ApifyService): TrendArbitrageService {
    if (!TrendArbitrageService.instance) {
      TrendArbitrageService.instance = new TrendArbitrageService(pool, apifyService);
    }
    return TrendArbitrageService.instance;
  }

  // ============================================
  // MAIN ANALYSIS METHODS
  // ============================================

  /**
   * Perform full trend analysis for given keywords
   */
  async analyzeTrends(config: TrendAnalysisConfig): Promise<TrendAnalysisResult> {
    const {
      seedKeywords,
      geo,
      timeframe,
      breakoutThreshold = this.BREAKOUT_THRESHOLD,
      risingThreshold = this.RISING_THRESHOLD,
      minVolume = this.MIN_VOLUME
    } = config;

    // Scrape Google Trends data
    const trendsData = await this.apifyService.scrapeGoogleTrends({
      searchTerms: seedKeywords,
      geo,
      timeRange: timeframe
    });

    // Analyze each keyword
    const signals: TrendSignal[] = [];

    for (const trend of trendsData) {
      const signal = await this.analyzeKeywordTrend(
        trend,
        geo,
        timeframe,
        breakoutThreshold,
        risingThreshold
      );

      if (signal && signal.currentVolume >= minVolume) {
        signals.push(signal);

        // Store in database
        await this.storeSignal(signal);
      }

      // Also analyze rising related queries
      for (const relatedQuery of trend.relatedQueries.rising.slice(0, 5)) {
        const relatedSignal = await this.analyzeRelatedQuery(
          relatedQuery,
          trend.term,
          geo,
          timeframe
        );

        if (relatedSignal) {
          signals.push(relatedSignal);
          await this.storeSignal(relatedSignal);
        }
      }
    }

    // Sort by growth rate
    signals.sort((a, b) => b.growthRate - a.growthRate);

    // Identify opportunities (actionable signals)
    const opportunities = signals.filter(s =>
      s.recommendedAction === 'attack' && s.confidence > 0.7
    );

    return {
      signals,
      breakoutCount: signals.filter(s => s.category === 'breakout').length,
      risingCount: signals.filter(s => s.category === 'rising').length,
      opportunities,
      analyzed: seedKeywords.length,
      timestamp: new Date()
    };
  }

  /**
   * Analyze a single keyword's trend data
   */
  private async analyzeKeywordTrend(
    trend: GoogleTrendsResult,
    geo: string,
    timeframe: string,
    breakoutThreshold: number,
    risingThreshold: number
  ): Promise<TrendSignal | null> {
    const timeline = trend.timelineData;

    if (!timeline || timeline.length < 2) {
      return null;
    }

    // Calculate growth rate
    const oldValue = timeline[0]?.value || 1;
    const newValue = timeline[timeline.length - 1]?.value || 0;
    const growthRate = ((newValue - oldValue) / oldValue) * 100;

    // Determine category
    const category = this.categorizeGrowth(growthRate, breakoutThreshold, risingThreshold);

    // Estimate volume (Google Trends is relative, so we estimate)
    const currentVolume = this.estimateVolume(newValue, trend.term);
    const predictedVolume = this.predictVolume(currentVolume, growthRate);

    // Assess competition
    const competitionLevel = await this.assessCompetition(trend.term);

    // Determine recommended action
    const recommendedAction = this.determineAction(category, competitionLevel, growthRate);

    // Extract related keywords
    const relatedKeywords = [
      ...trend.relatedQueries.rising.slice(0, 3).map(q => q.query),
      ...trend.relatedQueries.top.slice(0, 2).map(q => q.query)
    ];

    // Calculate confidence
    const confidence = this.calculateConfidence(timeline, growthRate, category);

    return {
      id: this.generateSignalId(),
      keyword: trend.term,
      category,
      growthRate: Math.round(growthRate),
      currentVolume,
      predictedVolume,
      competitionLevel,
      recommendedAction,
      relatedKeywords,
      geo,
      timeframe,
      confidence,
      detectedAt: new Date()
    };
  }

  /**
   * Analyze a rising related query
   */
  private async analyzeRelatedQuery(
    relatedQuery: { query: string; value: string },
    parentKeyword: string,
    geo: string,
    timeframe: string
  ): Promise<TrendSignal | null> {
    // Parse growth value (could be "Breakout" or a percentage)
    let growthRate: number;

    if (relatedQuery.value === 'Breakout' || relatedQuery.value.includes('+')) {
      growthRate = relatedQuery.value === 'Breakout' ? 5000 : parseInt(relatedQuery.value);
    } else {
      growthRate = parseInt(relatedQuery.value) || 100;
    }

    const category = this.categorizeGrowth(growthRate, this.BREAKOUT_THRESHOLD, this.RISING_THRESHOLD);
    const competitionLevel = await this.assessCompetition(relatedQuery.query);
    const recommendedAction = this.determineAction(category, competitionLevel, growthRate);

    return {
      id: this.generateSignalId(),
      keyword: relatedQuery.query,
      category,
      growthRate,
      currentVolume: this.estimateVolume(50, relatedQuery.query), // Lower estimate for related
      predictedVolume: this.predictVolume(500, growthRate),
      competitionLevel,
      recommendedAction,
      relatedKeywords: [parentKeyword],
      geo,
      timeframe,
      confidence: category === 'breakout' ? 0.85 : 0.75,
      detectedAt: new Date()
    };
  }

  // ============================================
  // KELATI-SPECIFIC ANALYSIS
  // ============================================

  /**
   * Analyze trends for Kelati salon (Houston loc services)
   */
  async analyzeKelatiTrends(): Promise<TrendAnalysisResult> {
    const kelatiConfig: TrendAnalysisConfig = {
      seedKeywords: [
        'sisterlocks',
        'sisterlocks houston',
        'microlocs',
        'microlocs houston',
        'loc maintenance',
        'loc retightening',
        'loc repair',
        'butterfly locs',
        'faux locs',
        'natural hair salon houston',
        'loctician houston',
        'loc stylist near me'
      ],
      geo: 'US-TX',
      timeframe: 'now 7-d',
      breakoutThreshold: 200,
      risingThreshold: 30,
      minVolume: 50
    };

    return this.analyzeTrends(kelatiConfig);
  }

  /**
   * Monitor specific Houston neighborhoods
   */
  async analyzeHoustonNeighborhoods(service: string): Promise<TrendSignal[]> {
    const neighborhoods = ['katy', 'sugar land', 'pearland', 'cypress', 'woodlands', 'humble'];
    const signals: TrendSignal[] = [];

    for (const neighborhood of neighborhoods) {
      const keyword = `${service} ${neighborhood}`;

      const result = await this.analyzeTrends({
        seedKeywords: [keyword],
        geo: 'US-TX',
        timeframe: 'now 7-d',
        breakoutThreshold: 150,
        risingThreshold: 25,
        minVolume: 20
      });

      signals.push(...result.signals);
    }

    return signals.sort((a, b) => b.growthRate - a.growthRate);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private categorizeGrowth(
    growthRate: number,
    breakoutThreshold: number,
    risingThreshold: number
  ): TrendCategory {
    if (growthRate >= breakoutThreshold) return 'breakout';
    if (growthRate >= risingThreshold) return 'rising';
    if (growthRate >= -10) return 'stable';
    return 'declining';
  }

  private estimateVolume(trendValue: number, keyword: string): number {
    // Rough estimation based on trend value and keyword characteristics
    // In production, would use actual keyword planner data
    const baseMultiplier = 100;
    const lengthFactor = Math.max(1, 5 - keyword.split(' ').length);
    return Math.round(trendValue * baseMultiplier * lengthFactor);
  }

  private predictVolume(currentVolume: number, growthRate: number): number {
    // Simple prediction based on current growth rate
    const growthMultiplier = 1 + (growthRate / 100) * 0.5; // Dampen prediction
    return Math.round(currentVolume * growthMultiplier);
  }

  private async assessCompetition(keyword: string): Promise<CompetitionLevel> {
    // Check database for existing competition data
    const result = await this.pool.query(`
      SELECT data->>'competitionLevel' as level
      FROM revenue_signals
      WHERE keyword = $1 AND signal_type = 'trend'
      ORDER BY created_at DESC
      LIMIT 1
    `, [keyword]);

    if (result.rows[0]?.level) {
      return result.rows[0].level as CompetitionLevel;
    }

    // Default assessment based on keyword characteristics
    const wordCount = keyword.split(' ').length;
    if (wordCount >= 4) return 'low';
    if (wordCount === 3) return 'medium';
    if (wordCount === 2) return 'medium';
    return 'high';
  }

  private determineAction(
    category: TrendCategory,
    competition: CompetitionLevel,
    growthRate: number
  ): RecommendedAction {
    // Decision matrix
    if (category === 'breakout' && competition !== 'saturated') {
      return 'attack';
    }

    if (category === 'rising') {
      if (competition === 'low') return 'attack';
      if (competition === 'medium') return growthRate > 100 ? 'attack' : 'monitor';
      return 'monitor';
    }

    if (category === 'stable') {
      return competition === 'low' ? 'monitor' : 'ignore';
    }

    // Declining
    return 'ignore';
  }

  private calculateConfidence(
    timeline: any[],
    growthRate: number,
    category: TrendCategory
  ): number {
    let confidence = 0.5;

    // More data points = higher confidence
    if (timeline.length >= 7) confidence += 0.15;
    else if (timeline.length >= 4) confidence += 0.1;

    // Consistent growth pattern = higher confidence
    const isConsistent = this.isGrowthConsistent(timeline);
    if (isConsistent) confidence += 0.15;

    // Higher growth rate in rising/breakout = higher confidence
    if (category === 'breakout' && growthRate > 500) confidence += 0.1;
    if (category === 'rising' && growthRate > 100) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  private isGrowthConsistent(timeline: any[]): boolean {
    if (timeline.length < 3) return true;

    let positiveChanges = 0;
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].value >= timeline[i - 1].value) {
        positiveChanges++;
      }
    }

    return positiveChanges / (timeline.length - 1) > 0.6;
  }

  private generateSignalId(): string {
    return `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // DATABASE METHODS
  // ============================================

  private async storeSignal(signal: TrendSignal): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO revenue_signals (
          signal_type, source, keyword, title, description, data,
          confidence, urgency, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'trend',
        'google_trends',
        signal.keyword,
        `${signal.category.toUpperCase()}: ${signal.keyword} (+${signal.growthRate}%)`,
        `${signal.recommendedAction} - Competition: ${signal.competitionLevel}`,
        JSON.stringify(signal),
        signal.confidence,
        signal.category === 'breakout' ? 'critical' : signal.category === 'rising' ? 'high' : 'medium',
        signal.detectedAt
      ]);
    } catch (error) {
      console.error('Error storing trend signal:', error);
    }
  }

  /**
   * Get recent trend signals from database
   */
  async getRecentSignals(limit: number = 20): Promise<TrendSignal[]> {
    const result = await this.pool.query(`
      SELECT data
      FROM revenue_signals
      WHERE signal_type = 'trend' AND source = 'google_trends'
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => row.data as TrendSignal);
  }

  /**
   * Get breakout trends only
   */
  async getBreakoutTrends(): Promise<TrendSignal[]> {
    const result = await this.pool.query(`
      SELECT data
      FROM revenue_signals
      WHERE signal_type = 'trend'
        AND source = 'google_trends'
        AND data->>'category' = 'breakout'
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY (data->>'growthRate')::int DESC
    `);

    return result.rows.map(row => row.data as TrendSignal);
  }
}

export default TrendArbitrageService;
