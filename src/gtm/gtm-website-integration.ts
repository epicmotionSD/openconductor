/**
 * OpenConductor GTM AI Engine Website Integration
 * 
 * Website Integration for Autonomous Revenue Acceleration
 * 
 * This system integrates our proprietary GTM AI Engine with the marketing website:
 * - Real-time lead intelligence capture from website behavior
 * - Automatic lead qualification using Trinity AI-powered scoring
 * - Intent signal detection from documentation usage and feature engagement
 * - Autonomous nurturing sequence triggers based on visitor behavior
 * - Enterprise prospect identification and scoring automation
 * - Revenue forecasting integration with website conversion data
 * - Community-to-enterprise conversion tracking and optimization
 * 
 * Competitive Advantage:
 * - First AIOps company with AI-driven website-to-revenue automation
 * - Real-time visitor intelligence and qualification
 * - Autonomous lead nurturing without manual intervention
 * - Predictive conversion optimization using Trinity AI agents
 * 
 * Integration Points:
 * - Homepage engagement tracking and intent scoring
 * - Pricing page ROI calculator usage and enterprise interest
 * - Documentation consumption patterns and technical evaluation
 * - Enterprise demo requests with automatic qualification
 * - Community signup conversion and upgrade path optimization
 */

import { Logger } from '../utils/logger';
import { GTMAIEngine } from './gtm-ai-engine';
import { LeadIntelligenceSystem } from './lead-intelligence-system';
import { ProspectQualificationEngine } from './prospect-qualification-engine';
import { ContentPersonalizationEngine } from './content-personalization-engine';
import { CommunicationEngine } from './communication-engine';

export interface WebsiteVisitor {
  visitorId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  timestamp: Date;
  
  // Visitor Context
  context: {
    isNewVisitor: boolean;
    isReturningVisitor: boolean;
    previousVisits: number;
    lastVisit?: Date;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    geoLocation?: string;
  };
  
  // Device and Technical
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
    screenResolution: string;
  };
  
  // Behavioral Data
  behavior: {
    pagesViewed: string[];
    timeOnSite: number; // seconds
    scrollDepth: Record<string, number>; // page -> percentage
    interactions: Array<{
      type: 'click' | 'form_fill' | 'download' | 'video_play';
      element: string;
      timestamp: Date;
    }>;
    exitIntent: boolean;
    conversionEvents: string[];
  };
  
  // Intent Signals
  intentSignals: {
    pricingPageVisit: boolean;
    roiCalculatorUsage: boolean;
    enterprisePageVisit: boolean;
    demoRequest: boolean;
    documentationEngagement: boolean;
    communitySignup: boolean;
    githubVisit: boolean;
    blogEngagement: boolean;
  };
  
  // Lead Data (if captured)
  leadData?: {
    email?: string;
    name?: string;
    company?: string;
    jobTitle?: string;
    phone?: string;
    leadSource: string;
    formSubmissions: number;
  };
}

export interface WebsiteIntentScore {
  visitorId: string;
  overallScore: number; // 0-100
  qualification: 'cold' | 'warm' | 'hot' | 'enterprise_qualified';
  
  // Scoring Breakdown
  scoring: {
    behavioralScore: number;
    engagementScore: number;
    intentScore: number;
    technicalScore: number;
    enterpriseScore: number;
  };
  
  // Intent Indicators
  indicators: {
    enterpriseInterest: boolean;
    technicalEvaluation: boolean;
    budgetAuthority: boolean;
    timelineUrgency: boolean;
    competitiveResearch: boolean;
  };
  
  // Recommended Actions
  actions: Array<{
    action: 'immediate_outreach' | 'nurture_sequence' | 'demo_invitation' | 'content_delivery' | 'community_engagement';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reasoning: string;
    expectedOutcome: string;
  }>;
}

export interface ConversionEvent {
  eventId: string;
  visitorId: string;
  eventType: 'page_view' | 'form_submission' | 'demo_request' | 'signup' | 'download' | 'enterprise_inquiry';
  timestamp: Date;
  
  // Event Data
  eventData: {
    page?: string;
    formType?: string;
    downloadAsset?: string;
    conversionValue?: number;
    leadScore?: number;
  };
  
  // Attribution
  attribution: {
    channel: string;
    source: string;
    medium: string;
    campaign?: string;
    firstTouch: Date;
    lastTouch: Date;
    touchpoints: number;
  };
  
  // Qualification
  qualification: {
    isEnterpriseQualified: boolean;
    leadScore: number;
    qualification: string;
    nextActions: string[];
  };
}

export class GTMWebsiteIntegration {
  private static instance: GTMWebsiteIntegration;
  private logger: Logger;
  private gtmEngine: GTMAIEngine;
  private leadIntelligence: LeadIntelligenceSystem;
  private prospectQualification: ProspectQualificationEngine;
  private contentPersonalization: ContentPersonalizationEngine;
  private communicationEngine: CommunicationEngine;
  
  // Website Data
  private activeVisitors: Map<string, WebsiteVisitor> = new Map();
  private intentScores: Map<string, WebsiteIntentScore> = new Map();
  private conversionEvents: Map<string, ConversionEvent> = new Map();
  
  // Analytics and Tracking
  private websiteMetrics: {
    dailyVisitors: number;
    conversionRate: number;
    enterpriseLeads: number;
    communitySignups: number;
    averageIntentScore: number;
  };
  
  // Background Processing
  private intentScoringInterval?: NodeJS.Timeout;
  private leadProcessingInterval?: NodeJS.Timeout;
  private conversionOptimizationInterval?: NodeJS.Timeout;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.gtmEngine = GTMAIEngine.getInstance();
    this.leadIntelligence = LeadIntelligenceSystem.getInstance();
    this.prospectQualification = ProspectQualificationEngine.getInstance();
    this.contentPersonalization = ContentPersonalizationEngine.getInstance();
    this.communicationEngine = CommunicationEngine.getInstance();
    
    // Initialize metrics
    this.websiteMetrics = {
      dailyVisitors: 0,
      conversionRate: 0,
      enterpriseLeads: 0,
      communitySignups: 0,
      averageIntentScore: 0
    };
    
    this.initializeGTMWebsiteIntegration();
  }

  public static getInstance(logger?: Logger): GTMWebsiteIntegration {
    if (!GTMWebsiteIntegration.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      GTMWebsiteIntegration.instance = new GTMWebsiteIntegration(logger);
    }
    return GTMWebsiteIntegration.instance;
  }

  /**
   * Initialize GTM AI Engine website integration
   */
  private async initializeGTMWebsiteIntegration(): Promise<void> {
    try {
      // Start real-time intent scoring
      this.startIntentScoring();
      
      // Start lead processing automation
      this.startLeadProcessing();
      
      // Start conversion optimization
      this.startConversionOptimization();
      
      this.logger.info('GTM AI Engine website integration initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize GTM website integration: ${error}`);
      throw error;
    }
  }

  /**
   * Capture website visitor and begin intent analysis
   */
  public async captureWebsiteVisitor(
    visitorData: Omit<WebsiteVisitor, 'visitorId' | 'timestamp' | 'intentSignals'>,
    pageContext: {
      page: string;
      referrer?: string;
      utmParams?: Record<string, string>;
    }
  ): Promise<WebsiteVisitor> {
    const visitorId = this.generateVisitorId();
    
    try {
      // Create visitor profile
      const visitor: WebsiteVisitor = {
        visitorId,
        timestamp: new Date(),
        ...visitorData,
        intentSignals: {
          pricingPageVisit: pageContext.page === '/pricing',
          roiCalculatorUsage: false,
          enterprisePageVisit: pageContext.page === '/enterprise',
          demoRequest: false,
          documentationEngagement: pageContext.page.startsWith('/docs'),
          communitySignup: false,
          githubVisit: false,
          blogEngagement: pageContext.page.startsWith('/blog')
        }
      };
      
      // Store visitor
      this.activeVisitors.set(visitorId, visitor);
      
      // Capture in GTM AI Engine for lead intelligence
      await this.gtmEngine.captureLeadIntelligence(visitorId, {
        type: 'website',
        action: `visited_${pageContext.page}`,
        engagement_score: this.calculateInitialEngagement(visitor, pageContext),
        intent_signals: Object.keys(visitor.intentSignals).filter(key => 
          visitor.intentSignals[key as keyof typeof visitor.intentSignals]
        )
      });
      
      // Start intent scoring
      await this.scoreVisitorIntent(visitorId);
      
      this.logger.info(`Website visitor captured: ${visitorId} (${pageContext.page})`);
      
      return visitor;
      
    } catch (error) {
      this.logger.error(`Failed to capture website visitor: ${error}`);
      throw error;
    }
  }

  /**
   * Process enterprise demo request with GTM AI qualification
   */
  public async processEnterpriseDemoRequest(
    visitorId: string,
    demoRequestData: {
      firstName: string;
      lastName: string;
      email: string;
      company: string;
      jobTitle: string;
      companySize: string;
      useCase: string;
      timeline: string;
      complianceRequirements: string[];
    }
  ): Promise<{
    qualified: boolean;
    leadScore: number;
    qualification: string;
    nextActions: string[];
    demoScheduled: boolean;
  }> {
    try {
      // Get visitor context
      const visitor = this.activeVisitors.get(visitorId);
      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }
      
      // Update visitor with lead data
      visitor.leadData = {
        email: demoRequestData.email,
        name: `${demoRequestData.firstName} ${demoRequestData.lastName}`,
        company: demoRequestData.company,
        jobTitle: demoRequestData.jobTitle,
        leadSource: 'enterprise_demo_request',
        formSubmissions: 1
      };
      
      // Update intent signals
      visitor.intentSignals.demoRequest = true;
      visitor.intentSignals.enterprisePageVisit = true;
      
      // Use GTM AI Engine for qualification
      const qualificationResult = await this.gtmEngine.qualifyLead(visitorId);
      
      // Use Prospect Qualification Engine for enterprise scoring
      const enterpriseQualification = await this.prospectQualification.qualifyEnterpriseProspect(
        {
          contactInfo: demoRequestData,
          companyInfo: {
            name: demoRequestData.company,
            size: demoRequestData.companySize,
            industry: 'technology' // Would be inferred
          },
          requirements: {
            useCase: demoRequestData.useCase,
            timeline: demoRequestData.timeline,
            complianceNeeds: demoRequestData.complianceRequirements
          }
        },
        {
          source: 'website_demo_request',
          channel: 'direct',
          campaign: visitor.context.utmCampaign
        }
      );
      
      // Schedule demo if highly qualified
      let demoScheduled = false;
      if (enterpriseQualification.qualified && enterpriseQualification.score >= 70) {
        demoScheduled = await this.scheduleAutomatedDemo(visitorId, demoRequestData);
      }
      
      // Trigger automated nurturing
      if (qualificationResult.qualified) {
        await this.gtmEngine.executeAutonomousNurturing(visitorId, 'enterprise_demo');
      }
      
      this.logger.info(`Enterprise demo request processed: ${visitorId} (${enterpriseQualification.qualification})`);
      
      return {
        qualified: enterpriseQualification.qualified,
        leadScore: enterpriseQualification.score,
        qualification: enterpriseQualification.qualification,
        nextActions: enterpriseQualification.recommendedActions,
        demoScheduled
      };
      
    } catch (error) {
      this.logger.error(`Failed to process enterprise demo request: ${error}`);
      throw error;
    }
  }

  /**
   * Process Community Edition signup with upgrade potential tracking
   */
  public async processCommunitySignup(
    visitorId: string,
    signupData: {
      firstName: string;
      lastName: string;
      email: string;
      company?: string;
      role?: string;
      useCase?: string;
    }
  ): Promise<{
    accountCreated: boolean;
    upgradeTooltip: number; // 0-100 likelihood of enterprise upgrade
    recommendedPath: string;
    nextActions: string[];
  }> {
    try {
      const visitor = this.activeVisitors.get(visitorId);
      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }
      
      // Update visitor with signup data
      visitor.leadData = {
        email: signupData.email,
        name: `${signupData.firstName} ${signupData.lastName}`,
        company: signupData.company,
        jobTitle: signupData.role,
        leadSource: 'community_signup',
        formSubmissions: 1
      };
      
      visitor.intentSignals.communitySignup = true;
      
      // Calculate enterprise upgrade potential
      const upgradePotential = await this.calculateUpgradePotential(visitor, signupData);
      
      // Determine recommended path
      const recommendedPath = upgradePotential >= 70 ? 'enterprise_fast_track' :
                             upgradePotential >= 40 ? 'professional_nurture' :
                             'community_engagement';
      
      // Trigger appropriate GTM automation
      await this.gtmEngine.captureLeadIntelligence(visitorId, {
        type: 'website',
        action: 'community_signup',
        engagement_score: upgradePotential,
        intent_signals: ['community_signup', 'open_source_interest']
      });
      
      // Start nurturing sequence
      if (upgradePotential >= 40) {
        await this.gtmEngine.executeAutonomousNurturing(visitorId, 'community_to_enterprise');
      }
      
      this.logger.info(`Community signup processed: ${visitorId} (upgrade potential: ${upgradePotential}%)`);
      
      return {
        accountCreated: true,
        upgradeTooltip: upgradePotential,
        recommendedPath,
        nextActions: this.generateNextActions(upgradePotential)
      };
      
    } catch (error) {
      this.logger.error(`Failed to process community signup: ${error}`);
      throw error;
    }
  }

  /**
   * Track website engagement and update intent scoring
   */
  public async trackWebsiteEngagement(
    visitorId: string,
    engagementData: {
      page: string;
      action: string;
      element?: string;
      value?: any;
      timeOnPage?: number;
      scrollDepth?: number;
    }
  ): Promise<void> {
    try {
      const visitor = this.activeVisitors.get(visitorId);
      if (!visitor) {
        return; // Visitor not tracked
      }
      
      // Update visitor behavior
      visitor.behavior.interactions.push({
        type: 'click',
        element: engagementData.element || engagementData.action,
        timestamp: new Date()
      });
      
      if (engagementData.timeOnPage) {
        visitor.behavior.timeOnSite += engagementData.timeOnPage;
      }
      
      if (engagementData.scrollDepth) {
        visitor.behavior.scrollDepth[engagementData.page] = engagementData.scrollDepth;
      }
      
      // Update intent signals based on engagement
      await this.updateIntentSignals(visitor, engagementData);
      
      // Recalculate intent score
      await this.scoreVisitorIntent(visitorId);
      
      // Trigger real-time actions if high intent
      const intentScore = this.intentScores.get(visitorId);
      if (intentScore && intentScore.overallScore >= 80) {
        await this.triggerHighIntentActions(visitorId, intentScore);
      }
      
    } catch (error) {
      this.logger.error(`Failed to track website engagement: ${error}`);
    }
  }

  // Private helper methods
  
  private async scoreVisitorIntent(visitorId: string): Promise<void> {
    const visitor = this.activeVisitors.get(visitorId);
    if (!visitor) return;
    
    // Calculate intent score using multiple factors
    let behavioralScore = this.calculateBehavioralScore(visitor);
    let engagementScore = this.calculateEngagementScore(visitor);
    let intentScore = this.calculateIntentSignalScore(visitor);
    let technicalScore = this.calculateTechnicalScore(visitor);
    let enterpriseScore = this.calculateEnterpriseScore(visitor);
    
    const overallScore = Math.round(
      (behavioralScore * 0.2) +
      (engagementScore * 0.25) +
      (intentScore * 0.3) +
      (technicalScore * 0.1) +
      (enterpriseScore * 0.15)
    );
    
    const qualification = overallScore >= 80 ? 'enterprise_qualified' :
                         overallScore >= 60 ? 'hot' :
                         overallScore >= 40 ? 'warm' : 'cold';
    
    const websiteIntentScore: WebsiteIntentScore = {
      visitorId,
      overallScore,
      qualification,
      scoring: {
        behavioralScore,
        engagementScore,
        intentScore,
        technicalScore,
        enterpriseScore
      },
      indicators: {
        enterpriseInterest: visitor.intentSignals.enterprisePageVisit || visitor.intentSignals.demoRequest,
        technicalEvaluation: visitor.intentSignals.documentationEngagement,
        budgetAuthority: this.assessBudgetAuthority(visitor),
        timelineUrgency: this.assessTimelineUrgency(visitor),
        competitiveResearch: this.assessCompetitiveResearch(visitor)
      },
      actions: this.generateRecommendedActions(overallScore, visitor)
    };
    
    this.intentScores.set(visitorId, websiteIntentScore);
  }

  private calculateBehavioralScore(visitor: WebsiteVisitor): number {
    let score = 0;
    
    // Time on site
    if (visitor.behavior.timeOnSite > 300) score += 20; // 5+ minutes
    if (visitor.behavior.timeOnSite > 180) score += 15; // 3+ minutes
    if (visitor.behavior.timeOnSite > 60) score += 10; // 1+ minute
    
    // Page depth
    score += Math.min(30, visitor.behavior.pagesViewed.length * 5);
    
    // Scroll engagement
    const avgScrollDepth = Object.values(visitor.behavior.scrollDepth).reduce((a, b) => a + b, 0) / 
                          Object.values(visitor.behavior.scrollDepth).length || 0;
    if (avgScrollDepth > 75) score += 15;
    if (avgScrollDepth > 50) score += 10;
    
    // Interactions
    score += Math.min(20, visitor.behavior.interactions.length * 2);
    
    return Math.min(100, score);
  }

  private calculateEngagementScore(visitor: WebsiteVisitor): number {
    let score = 0;
    
    // High-value page visits
    if (visitor.behavior.pagesViewed.includes('/pricing')) score += 25;
    if (visitor.behavior.pagesViewed.includes('/enterprise')) score += 30;
    if (visitor.behavior.pagesViewed.includes('/docs')) score += 15;
    if (visitor.behavior.pagesViewed.includes('/blog')) score += 10;
    
    // Return visitor bonus
    if (visitor.context.isReturningVisitor) score += 15;
    if (visitor.context.previousVisits > 3) score += 10;
    
    // Referral quality
    if (visitor.referrer && visitor.referrer.includes('github.com')) score += 10;
    if (visitor.referrer && visitor.referrer.includes('google.com')) score += 5;
    
    return Math.min(100, score);
  }

  private calculateIntentSignalScore(visitor: WebsiteVisitor): number {
    let score = 0;
    
    // Intent signals scoring
    if (visitor.intentSignals.demoRequest) score += 40;
    if (visitor.intentSignals.enterprisePageVisit) score += 25;
    if (visitor.intentSignals.pricingPageVisit) score += 20;
    if (visitor.intentSignals.roiCalculatorUsage) score += 30;
    if (visitor.intentSignals.documentationEngagement) score += 15;
    if (visitor.intentSignals.blogEngagement) score += 10;
    if (visitor.intentSignals.communitySignup) score += 15;
    
    return Math.min(100, score);
  }

  private calculateTechnicalScore(visitor: WebsiteVisitor): number {
    let score = 0;
    
    // Technical interest indicators
    if (visitor.behavior.pagesViewed.includes('/docs/api')) score += 20;
    if (visitor.behavior.pagesViewed.includes('/docs/trinity-ai')) score += 15;
    if (visitor.behavior.pagesViewed.includes('/docs/security')) score += 25;
    if (visitor.behavior.pagesViewed.includes('/docs/enterprise')) score += 30;
    
    // Technical context
    if (visitor.device.type === 'desktop') score += 10; // Developers typically use desktop
    if (visitor.userAgent.includes('Linux')) score += 5; // Technical users often use Linux
    
    return Math.min(100, score);
  }

  private calculateEnterpriseScore(visitor: WebsiteVisitor): number {
    let score = 0;
    
    // Enterprise indicators
    if (visitor.leadData?.email && !this.isPersonalEmail(visitor.leadData.email)) score += 20;
    if (visitor.leadData?.company) score += 15;
    if (visitor.leadData?.jobTitle && this.isEnterpriseRole(visitor.leadData.jobTitle)) score += 25;
    
    // Enterprise page engagement
    if (visitor.intentSignals.enterprisePageVisit) score += 20;
    if (visitor.intentSignals.demoRequest) score += 25;
    
    // UTM parameters indicating enterprise marketing
    if (visitor.context.utmSource?.includes('enterprise')) score += 15;
    if (visitor.context.utmCampaign?.includes('enterprise')) score += 15;
    
    return Math.min(100, score);
  }

  // Background processing methods
  
  private startIntentScoring(): void {
    this.intentScoringInterval = setInterval(async () => {
      for (const visitorId of this.activeVisitors.keys()) {
        await this.scoreVisitorIntent(visitorId);
      }
    }, 30000); // Every 30 seconds
  }

  private startLeadProcessing(): void {
    this.leadProcessingInterval = setInterval(async () => {
      await this.processQualifiedLeads();
    }, 60000); // Every minute
  }

  private startConversionOptimization(): void {
    this.conversionOptimizationInterval = setInterval(async () => {
      await this.optimizeConversions();
    }, 300000); // Every 5 minutes
  }

  private async processQualifiedLeads(): Promise<void> {
    // Process highly qualified leads for immediate outreach
    for (const [visitorId, intentScore] of this.intentScores.entries()) {
      if (intentScore.overallScore >= 80 && intentScore.qualification === 'enterprise_qualified') {
        await this.triggerImmediateEnterpriseOutreach(visitorId);
      }
    }
  }

  // Utility methods
  private generateVisitorId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateInitialEngagement(visitor: WebsiteVisitor, pageContext: any): number {
    let engagement = 50; // Base score
    
    if (pageContext.page === '/enterprise') engagement += 30;
    if (pageContext.page === '/pricing') engagement += 25;
    if (pageContext.page.startsWith('/docs')) engagement += 15;
    
    return engagement;
  }

  private isPersonalEmail(email: string): boolean {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return personalDomains.some(domain => email.includes(domain));
  }

  private isEnterpriseRole(jobTitle: string): boolean {
    const enterpriseRoles = ['cto', 'vp', 'director', 'manager', 'ciso', 'ceo'];
    return enterpriseRoles.some(role => jobTitle.toLowerCase().includes(role));
  }

  // Public API methods
  
  public getWebsiteMetrics(): typeof this.websiteMetrics {
    return { ...this.websiteMetrics };
  }

  public getActiveVisitors(): WebsiteVisitor[] {
    return Array.from(this.activeVisitors.values());
  }

  public getIntentScores(): WebsiteIntentScore[] {
    return Array.from(this.intentScores.values());
  }
}

export default GTMWebsiteIntegration;