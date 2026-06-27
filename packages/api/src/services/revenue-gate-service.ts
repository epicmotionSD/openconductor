// Revenue Gate Service - Pre-deployment Validation
// Validates deployments against revenue and quality criteria before going live

import { Pool } from 'pg';
import { TemplateService } from './template-service';
import { TrendArbitrageService } from './trend-arbitrage-service';
import { ApifyService } from './apify-service';

// Types
export interface RevenueGateResult {
  approved: boolean;
  score: number;
  checks: GateCheck[];
  recommendations: string[];
  estimatedROAS: number;
  estimatedTraffic: number;
  risks: Risk[];
  blockers: string[];
}

export interface GateCheck {
  name: string;
  category: 'seo' | 'performance' | 'content' | 'competition' | 'budget';
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  details?: Record<string, any>;
}

export interface Risk {
  level: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  mitigation: string;
}

export interface DeploymentValidationInput {
  templateId: string;
  targetKeyword: string;
  targetUrl: string;
  content: Record<string, any>;
  estimatedBudget?: number;
  geo?: string;
}

export interface QualityScoreFactors {
  seoScore: number;
  contentScore: number;
  performanceScore: number;
  competitionScore: number;
  budgetScore: number;
}

export class RevenueGateService {
  private static instance: RevenueGateService;
  private pool: Pool;
  private templateService: TemplateService;
  private trendService: TrendArbitrageService;
  private apifyService: ApifyService;

  // Thresholds
  private readonly MIN_APPROVAL_SCORE = 70;
  private readonly MIN_SEO_SCORE = 60;
  private readonly MAX_KEYWORD_COMPETITION = 0.8; // 80%
  private readonly MIN_CONTENT_COMPLETENESS = 0.7; // 70%

  private constructor(pool: Pool) {
    this.pool = pool;
    this.templateService = TemplateService.getInstance(pool);
    this.apifyService = ApifyService.getInstance(pool);
    this.trendService = TrendArbitrageService.getInstance(pool, this.apifyService);
  }

  static getInstance(pool: Pool): RevenueGateService {
    if (!RevenueGateService.instance) {
      RevenueGateService.instance = new RevenueGateService(pool);
    }
    return RevenueGateService.instance;
  }

  // ============================================
  // MAIN VALIDATION METHOD
  // ============================================

  /**
   * Run full revenue gate validation
   */
  async validateDeployment(input: DeploymentValidationInput): Promise<RevenueGateResult> {
    const checks: GateCheck[] = [];
    const recommendations: string[] = [];
    const risks: Risk[] = [];
    const blockers: string[] = [];

    // 1. SEO Validation
    const seoCheck = await this.validateSEO(input);
    checks.push(seoCheck);
    if (!seoCheck.passed) {
      recommendations.push(seoCheck.message);
    }

    // 2. Content Validation
    const contentCheck = await this.validateContent(input);
    checks.push(contentCheck);
    if (!contentCheck.passed) {
      recommendations.push(contentCheck.message);
    }

    // 3. Competition Analysis
    const competitionCheck = await this.validateCompetition(input);
    checks.push(competitionCheck);
    if (!competitionCheck.passed) {
      risks.push({
        level: competitionCheck.score < 30 ? 'high' : 'medium',
        type: 'competition',
        description: competitionCheck.message,
        mitigation: 'Consider long-tail keyword variations or different geo targeting'
      });
    }

    // 4. Performance Budget
    const performanceCheck = await this.validatePerformance(input);
    checks.push(performanceCheck);
    if (!performanceCheck.passed) {
      recommendations.push(performanceCheck.message);
    }

    // 5. Budget/ROAS Validation
    const budgetCheck = await this.validateBudget(input);
    checks.push(budgetCheck);
    if (!budgetCheck.passed && input.estimatedBudget) {
      risks.push({
        level: 'medium',
        type: 'budget',
        description: 'Estimated ROAS is below threshold',
        mitigation: 'Consider reducing CPC bids or improving conversion funnel'
      });
    }

    // 6. Template Appropriateness
    const templateCheck = await this.validateTemplateChoice(input);
    checks.push(templateCheck);
    if (!templateCheck.passed) {
      recommendations.push(templateCheck.message);
    }

    // Calculate overall score
    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
    const overallScore = Math.round((totalScore / maxScore) * 100);

    // Determine blockers
    if (seoCheck.score < 30) {
      blockers.push('Critical SEO issues: Missing title or meta description');
    }
    if (contentCheck.score < 30) {
      blockers.push('Critical content issues: Required fields missing');
    }

    // Estimate metrics
    const estimatedROAS = this.estimateROAS(checks, input);
    const estimatedTraffic = this.estimateTraffic(input, competitionCheck);

    return {
      approved: overallScore >= this.MIN_APPROVAL_SCORE && blockers.length === 0,
      score: overallScore,
      checks,
      recommendations,
      estimatedROAS,
      estimatedTraffic,
      risks,
      blockers
    };
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  /**
   * Validate SEO requirements
   */
  private async validateSEO(input: DeploymentValidationInput): Promise<GateCheck> {
    const { content, targetKeyword } = input;
    let score = 0;
    const issues: string[] = [];

    // Title check (20 points)
    const title = content.title || content.headline;
    if (title) {
      score += 10;
      if (title.length >= 30 && title.length <= 60) {
        score += 5;
      } else {
        issues.push('Title should be 30-60 characters');
      }
      if (title.toLowerCase().includes(targetKeyword.toLowerCase().split(' ')[0])) {
        score += 5;
      } else {
        issues.push('Title should include target keyword');
      }
    } else {
      issues.push('Title/headline is required');
    }

    // Meta description check (15 points)
    const description = content.metaDescription || content.description;
    if (description) {
      score += 7;
      if (description.length >= 120 && description.length <= 160) {
        score += 5;
      } else {
        issues.push('Meta description should be 120-160 characters');
      }
      if (description.toLowerCase().includes(targetKeyword.toLowerCase().split(' ')[0])) {
        score += 3;
      }
    } else {
      issues.push('Meta description is recommended');
    }

    // H1 check (10 points)
    const h1 = content.headline || content.title;
    if (h1) {
      score += 10;
    }

    // Image alt text check (5 points)
    if (content.heroImage || content.featuredImage) {
      score += 5; // Assume images need alt text
    }

    return {
      name: 'SEO Validation',
      category: 'seo',
      passed: score >= 35, // 70% of 50
      score,
      maxScore: 50,
      message: issues.length > 0 ? issues.join('; ') : 'SEO requirements met',
      details: { issues }
    };
  }

  /**
   * Validate content completeness
   */
  private async validateContent(input: DeploymentValidationInput): Promise<GateCheck> {
    const { templateId, content } = input;
    const schema = this.templateService.getComponentSchema(templateId);

    if (!schema) {
      return {
        name: 'Content Validation',
        category: 'content',
        passed: false,
        score: 0,
        maxScore: 30,
        message: 'Template schema not found'
      };
    }

    const requiredFields = schema.variables.filter(v => v.required);
    const filledRequired = requiredFields.filter(v =>
      content[v.key] !== undefined && content[v.key] !== null && content[v.key] !== ''
    );

    const completeness = requiredFields.length > 0
      ? filledRequired.length / requiredFields.length
      : 1;

    const score = Math.round(completeness * 30);

    const missingFields = requiredFields
      .filter(v => !content[v.key])
      .map(v => v.label);

    return {
      name: 'Content Validation',
      category: 'content',
      passed: completeness >= this.MIN_CONTENT_COMPLETENESS,
      score,
      maxScore: 30,
      message: missingFields.length > 0
        ? `Missing required fields: ${missingFields.join(', ')}`
        : 'All required content provided',
      details: {
        completeness: Math.round(completeness * 100),
        missingFields
      }
    };
  }

  /**
   * Validate keyword competition
   */
  private async validateCompetition(input: DeploymentValidationInput): Promise<GateCheck> {
    const { targetKeyword, geo } = input;

    // Check recent trend signals for competition data
    const result = await this.pool.query(`
      SELECT data
      FROM revenue_signals
      WHERE keyword ILIKE $1 AND signal_type = 'trend'
      ORDER BY created_at DESC
      LIMIT 1
    `, [`%${targetKeyword.split(' ')[0]}%`]);

    let competitionLevel = 'medium';
    let competitionScore = 50; // Default medium

    if (result.rows[0]?.data) {
      const signal = result.rows[0].data;
      competitionLevel = signal.competitionLevel || 'medium';

      switch (competitionLevel) {
        case 'low':
          competitionScore = 85;
          break;
        case 'medium':
          competitionScore = 60;
          break;
        case 'high':
          competitionScore = 35;
          break;
        case 'saturated':
          competitionScore = 15;
          break;
      }
    }

    // Adjust for long-tail keywords
    const wordCount = targetKeyword.split(' ').length;
    if (wordCount >= 4) {
      competitionScore = Math.min(100, competitionScore + 15);
    } else if (wordCount >= 3) {
      competitionScore = Math.min(100, competitionScore + 10);
    }

    // Adjust for local keywords
    const hasLocation = /houston|texas|tx|katy|sugar land|pearland|cypress/i.test(targetKeyword);
    if (hasLocation) {
      competitionScore = Math.min(100, competitionScore + 10);
    }

    const normalizedScore = Math.round((competitionScore / 100) * 20);

    return {
      name: 'Competition Analysis',
      category: 'competition',
      passed: competitionScore >= 40,
      score: normalizedScore,
      maxScore: 20,
      message: `Competition level: ${competitionLevel}${hasLocation ? ' (local keyword bonus)' : ''}`,
      details: {
        competitionLevel,
        rawScore: competitionScore,
        hasLocation,
        wordCount
      }
    };
  }

  /**
   * Validate performance expectations
   */
  private async validatePerformance(input: DeploymentValidationInput): Promise<GateCheck> {
    const { templateId, content } = input;
    let score = 15; // Start with full score, deduct for issues
    const issues: string[] = [];

    // Check image optimization
    const imageFields = ['heroImage', 'featuredImage', 'productImage', 'profileImage'];
    for (const field of imageFields) {
      if (content[field]) {
        const url = content[field];
        // Check if it's a CDN/optimized URL
        if (!/cloudinary|cloudflare|imgix|vercel/i.test(url)) {
          score -= 2;
          issues.push(`${field} should use CDN for better performance`);
        }
      }
    }

    // Check for external dependencies
    if (content.bookingWidgetUrl || content.mapEmbedUrl) {
      score -= 3;
      issues.push('External embeds may impact load time');
    }

    // Bonus for minimal content templates
    const minimalTemplates = ['T10', 'T08'];
    if (minimalTemplates.includes(templateId)) {
      score = Math.min(15, score + 2);
    }

    return {
      name: 'Performance Budget',
      category: 'performance',
      passed: score >= 10,
      score: Math.max(0, score),
      maxScore: 15,
      message: issues.length > 0 ? issues.join('; ') : 'Performance expectations met',
      details: { issues }
    };
  }

  /**
   * Validate budget/ROAS expectations
   */
  private async validateBudget(input: DeploymentValidationInput): Promise<GateCheck> {
    const { targetKeyword, estimatedBudget } = input;

    if (!estimatedBudget) {
      return {
        name: 'Budget Validation',
        category: 'budget',
        passed: true, // Skip if no budget provided
        score: 10,
        maxScore: 10,
        message: 'No budget specified - skipping ROAS validation'
      };
    }

    // Estimate CPC based on keyword
    let estimatedCPC = 2.5; // Default
    const highCPCPatterns = ['attorney', 'lawyer', 'insurance', 'loan', 'mortgage'];
    const lowCPCPatterns = ['diy', 'free', 'how to', 'tutorial'];

    const lowerKeyword = targetKeyword.toLowerCase();
    if (highCPCPatterns.some(p => lowerKeyword.includes(p))) {
      estimatedCPC = 15;
    } else if (lowCPCPatterns.some(p => lowerKeyword.includes(p))) {
      estimatedCPC = 0.5;
    }

    // Local service keywords
    if (/sisterlocks|locs|hair salon|loctician/i.test(lowerKeyword)) {
      estimatedCPC = 3.5;
    }

    // Calculate estimated clicks
    const estimatedClicks = Math.floor(estimatedBudget / estimatedCPC);

    // Estimate conversions (2-5% conversion rate)
    const conversionRate = 0.03;
    const estimatedConversions = Math.floor(estimatedClicks * conversionRate);

    // Average order value (salon example: $150)
    const avgOrderValue = 150;
    const estimatedRevenue = estimatedConversions * avgOrderValue;
    const estimatedROAS = estimatedBudget > 0 ? estimatedRevenue / estimatedBudget : 0;

    const score = estimatedROAS >= 3 ? 10 : estimatedROAS >= 2 ? 7 : estimatedROAS >= 1 ? 4 : 2;

    return {
      name: 'Budget Validation',
      category: 'budget',
      passed: estimatedROAS >= 2,
      score,
      maxScore: 10,
      message: `Estimated ROAS: ${estimatedROAS.toFixed(1)}x`,
      details: {
        estimatedCPC,
        estimatedClicks,
        estimatedConversions,
        estimatedRevenue,
        estimatedROAS
      }
    };
  }

  /**
   * Validate template choice for keyword
   */
  private async validateTemplateChoice(input: DeploymentValidationInput): Promise<GateCheck> {
    const { templateId, targetKeyword } = input;

    const recommendations = await this.templateService.recommendTemplate(targetKeyword);
    const topRecommendation = recommendations[0];

    if (!topRecommendation) {
      return {
        name: 'Template Choice',
        category: 'content',
        passed: true,
        score: 8,
        maxScore: 10,
        message: 'Template choice appears reasonable'
      };
    }

    const isTopChoice = topRecommendation.template.templateId === templateId;
    const isTopThree = recommendations.slice(0, 3).some(r => r.template.templateId === templateId);

    let score = 5;
    let message = '';

    if (isTopChoice) {
      score = 10;
      message = `Optimal template for "${targetKeyword}"`;
    } else if (isTopThree) {
      score = 8;
      message = `Good template choice; top recommendation: ${topRecommendation.template.name}`;
    } else {
      score = 5;
      message = `Consider using ${topRecommendation.template.name} (${topRecommendation.template.templateId}) - ${topRecommendation.reason}`;
    }

    return {
      name: 'Template Choice',
      category: 'content',
      passed: isTopThree,
      score,
      maxScore: 10,
      message,
      details: {
        chosen: templateId,
        recommended: topRecommendation.template.templateId,
        reason: topRecommendation.reason
      }
    };
  }

  // ============================================
  // ESTIMATION METHODS
  // ============================================

  private estimateROAS(checks: GateCheck[], input: DeploymentValidationInput): number {
    const budgetCheck = checks.find(c => c.category === 'budget');
    if (budgetCheck?.details?.estimatedROAS) {
      return budgetCheck.details.estimatedROAS;
    }

    // Default estimate based on overall score
    const avgScore = checks.reduce((sum, c) => sum + (c.score / c.maxScore), 0) / checks.length;
    return Math.round((2 + avgScore * 3) * 10) / 10; // 2x to 5x ROAS
  }

  private estimateTraffic(input: DeploymentValidationInput, competitionCheck: GateCheck): number {
    const competitionLevel = competitionCheck.details?.competitionLevel || 'medium';
    const baseTraffic = {
      low: 500,
      medium: 200,
      high: 100,
      saturated: 50
    };

    const base = baseTraffic[competitionLevel as keyof typeof baseTraffic] || 200;

    // Adjust for local keywords
    const hasLocation = /houston|texas|tx|katy/i.test(input.targetKeyword);
    const locationMultiplier = hasLocation ? 1.5 : 1;

    return Math.round(base * locationMultiplier);
  }

  // ============================================
  // QUICK CHECK METHODS
  // ============================================

  /**
   * Quick pre-check before full validation
   */
  async quickCheck(templateId: string, targetKeyword: string): Promise<{
    canProceed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check template exists
    const template = await this.templateService.getTemplateById(templateId);
    if (!template) {
      issues.push(`Template ${templateId} not found`);
    }

    // Check keyword validity
    if (!targetKeyword || targetKeyword.length < 3) {
      issues.push('Target keyword must be at least 3 characters');
    }

    // Check for duplicate recent deployments
    const recentDeployment = await this.pool.query(`
      SELECT id FROM deployments
      WHERE target_keyword ILIKE $1
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status != 'failed'
      LIMIT 1
    `, [targetKeyword]);

    if (recentDeployment.rows.length > 0) {
      issues.push('A deployment for this keyword was created in the last 24 hours');
    }

    return {
      canProceed: issues.length === 0,
      issues
    };
  }
}

export default RevenueGateService;
