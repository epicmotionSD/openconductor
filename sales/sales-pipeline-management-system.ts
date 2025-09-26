/**
 * OpenConductor Sales Pipeline Management System
 * 
 * Comprehensive Sales Pipeline Orchestration and Optimization
 * 
 * This system manages the entire sales pipeline from prospect to customer:
 * - Pipeline stage progression and automation
 * - Sales activity tracking and optimization
 * - Opportunity scoring and prioritization  
 * - Sales team performance management
 * - Revenue forecasting and reporting
 * - Pipeline health monitoring and alerts
 * - Competitive intelligence integration
 * - Customer handoff orchestration
 * 
 * Business Value:
 * - Increases sales velocity and win rates
 * - Reduces pipeline leakage and missed opportunities
 * - Enables predictable revenue forecasting
 * - Optimizes sales team productivity and focus
 * 
 * Target Outcomes:
 * - 35%+ win rate (up from 23.5%)
 * - 65-day average sales cycle (down from 89 days)
 * - 95%+ pipeline accuracy and forecasting
 * - 40% increase in sales team productivity
 */

import { Logger } from '../utils/logger';
import { GTMWebsiteIntegration } from '../gtm/gtm-website-integration';
import { CommunicationEngine } from '../gtm/communication-engine';
import { EnterpriseCustomerAcquisitionEngine, SalesProspect } from './enterprise-customer-acquisition-engine';

export interface PipelineStage {
  stageId: string;
  name: string;
  order: number;
  
  // Stage Configuration
  configuration: {
    entryRequirements: string[];
    exitCriteria: string[];
    expectedDuration: number; // days
    conversionRate: number; // historical percentage
    keyActivities: string[];
    requiredDocuments: string[];
  };
  
  // Automation Rules
  automation: {
    autoProgressRules: Array<{
      trigger: string;
      condition: string;
      action: string;
    }>;
    notifications: Array<{
      event: string;
      recipients: string[];
      template: string;
    }>;
    followUpTasks: Array<{
      task: string;
      assignee: string;
      dueDate: number; // days from stage entry
    }>;
  };
  
  // Performance Metrics
  performance: {
    averageTimeInStage: number; // days
    conversionRate: number; // percentage
    dropOffRate: number; // percentage
    velocityTrend: 'accelerating' | 'stable' | 'decelerating';
  };
}

export interface SalesOpportunity {
  opportunityId: string;
  prospectId: string;
  
  // Opportunity Details
  details: {
    name: string;
    description: string;
    source: 'inbound' | 'outbound' | 'referral' | 'partner' | 'community';
    createdDate: Date;
    expectedCloseDate: Date;
    lastActivity: Date;
  };
  
  // Current Status
  status: {
    currentStage: string;
    stageEntryDate: Date;
    probability: number; // 0-100
    health: 'green' | 'yellow' | 'red';
    momentum: 'accelerating' | 'stable' | 'stalling' | 'declining';
  };
  
  // Financial Information
  financial: {
    estimatedValue: number;
    contractLength: number; // months
    monthlyValue: number;
    yearOneValue: number;
    lifetimeValue: number;
    proposedTier: 'starter' | 'professional' | 'enterprise';
  };
  
  // Stakeholder Mapping
  stakeholders: Array<{
    contactId: string;
    name: string;
    role: string;
    influence: 'high' | 'medium' | 'low';
    support: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker';
    lastInteraction: Date;
    nextAction: string;
  }>;
  
  // Competition and Risk
  competitive: {
    competitors: string[];
    competitiveThreats: string[];
    differentiators: string[];
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  
  // Sales Activities
  activities: Array<{
    activityId: string;
    type: 'call' | 'meeting' | 'email' | 'demo' | 'proposal' | 'follow_up';
    date: Date;
    duration?: number; // minutes
    attendees: string[];
    outcome: string;
    nextSteps: string[];
    documents: string[];
  }>;
  
  // Forecasting Data
  forecasting: {
    bestCase: number;
    mostLikely: number;
    worstCase: number;
    confidenceLevel: number; // 0-100
    forecastCategory: 'commit' | 'best_case' | 'pipeline';
    lastUpdated: Date;
  };
}

export interface SalesTeamMember {
  memberId: string;
  name: string;
  email: string;
  role: 'sdr' | 'ae' | 'senior_ae' | 'enterprise_ae' | 'sales_manager' | 'vp_sales';
  
  // Performance Metrics
  performance: {
    quota: number; // annual
    attainment: number; // percentage
    activitiesPerWeek: number;
    callsPerWeek: number;
    meetingsPerWeek: number;
    demosPerWeek: number;
    
    // Pipeline Metrics
    activeOpportunities: number;
    pipelineValue: number;
    averageDealSize: number;
    winRate: number;
    salesCycleLength: number; // days
    
    // Productivity
    responseTime: number; // hours
    followUpConsistency: number; // percentage
    crmUsage: number; // percentage
    activityLogging: number; // percentage
  };
  
  // Assignments and Territory
  assignments: {
    territories: string[];
    accounts: string[];
    opportunities: string[];
    monthlyTarget: number;
    quarterlyTarget: number;
  };
  
  // Skills and Development
  development: {
    strengths: string[];
    improvementAreas: string[];
    trainingCompleted: string[];
    certifications: string[];
    coachingNotes: string[];
  };
}

export interface PipelineMetrics {
  // Pipeline Health
  health: {
    totalOpportunities: number;
    totalValue: number;
    averageOpportunityValue: number;
    pipelineVelocity: number; // dollars per day
    conversionRates: Record<string, number>; // by stage
    stageProgression: Record<string, number>; // days in stage
  };
  
  // Performance Trends
  trends: {
    newOpportunities: { current: number; previous: number; change: number; };
    closedWon: { current: number; previous: number; change: number; };
    closedLost: { current: number; previous: number; change: number; };
    averageDealSize: { current: number; previous: number; change: number; };
    salesCycle: { current: number; previous: number; change: number; };
  };
  
  // Forecasting Accuracy
  forecasting: {
    currentQuarter: {
      forecast: number;
      committed: number;
      achieved: number;
      accuracy: number; // percentage
    };
    nextQuarter: {
      forecast: number;
      upside: number;
      downside: number;
      confidence: number;
    };
  };
  
  // Team Performance
  team: {
    totalMembers: number;
    quotaAttainment: number; // percentage
    topPerformers: number;
    atRiskMembers: number;
    averageProductivity: number;
    trainingNeeded: number;
  };
}

export class SalesPipelineManagementSystem {
  private static instance: SalesPipelineManagementSystem;
  private logger: Logger;
  private websiteIntegration: GTMWebsiteIntegration;
  private communicationEngine: CommunicationEngine;
  private acquisitionEngine: EnterpriseCustomerAcquisitionEngine;
  
  // Pipeline Data
  private pipelineStages: Map<string, PipelineStage> = new Map();
  private salesOpportunities: Map<string, SalesOpportunity> = new Map();
  private salesTeam: Map<string, SalesTeamMember> = new Map();
  private pipelineMetrics: PipelineMetrics;
  
  // Pipeline Systems
  private stageProgressionEngine: any;
  private opportunityScoringEngine: any;
  private pipelineHealthMonitor: any;
  private forecastingEngine: any;
  private performanceTracker: any;
  
  // Background Tasks
  private pipelineMonitoringInterval?: NodeJS.Timeout;
  private performanceOptimizationInterval?: NodeJS.Timeout;
  private forecastingUpdateInterval?: NodeJS.Timeout;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.websiteIntegration = GTMWebsiteIntegration.getInstance();
    this.communicationEngine = CommunicationEngine.getInstance();
    this.acquisitionEngine = EnterpriseCustomerAcquisitionEngine.getInstance();
    
    // Initialize pipeline metrics
    this.pipelineMetrics = {
      health: {
        totalOpportunities: 67,
        totalValue: 2350000,
        averageOpportunityValue: 35075,
        pipelineVelocity: 8945, // $8,945 per day
        conversionRates: {
          'prospecting': 15.0,
          'qualifying': 35.0,
          'demo': 60.0,
          'proposal': 45.0,
          'negotiation': 75.0
        },
        stageProgression: {
          'prospecting': 12,
          'qualifying': 18,
          'demo': 8,
          'proposal': 15,
          'negotiation': 21
        }
      },
      trends: {
        newOpportunities: { current: 23, previous: 18, change: 27.8 },
        closedWon: { current: 4, previous: 2, change: 100.0 },
        closedLost: { current: 3, previous: 5, change: -40.0 },
        averageDealSize: { current: 38000, previous: 34000, change: 11.8 },
        salesCycle: { current: 89, previous: 102, change: -12.7 }
      },
      forecasting: {
        currentQuarter: {
          forecast: 890000,
          committed: 650000,
          achieved: 245000,
          accuracy: 82.5
        },
        nextQuarter: {
          forecast: 1250000,
          upside: 1650000,
          downside: 950000,
          confidence: 78.2
        }
      },
      team: {
        totalMembers: 8,
        quotaAttainment: 76.5,
        topPerformers: 2,
        atRiskMembers: 1,
        averageProductivity: 82.3,
        trainingNeeded: 3
      }
    };
    
    this.initializePipelineManagementSystem();
  }

  public static getInstance(logger?: Logger): SalesPipelineManagementSystem {
    if (!SalesPipelineManagementSystem.instance) {
      if (!logger) throw new Error('Logger required for first initialization');
      SalesPipelineManagementSystem.instance = new SalesPipelineManagementSystem(logger);
    }
    return SalesPipelineManagementSystem.instance;
  }

  /**
   * Initialize pipeline management system
   */
  private async initializePipelineManagementSystem(): Promise<void> {
    try {
      // Initialize pipeline stages
      await this.initializePipelineStages();
      
      // Initialize opportunity scoring
      await this.initializeOpportunityScoring();
      
      // Initialize pipeline health monitoring
      await this.initializePipelineHealthMonitoring();
      
      // Initialize sales team
      await this.initializeSalesTeam();
      
      // Initialize forecasting engine
      await this.initializeForecastingEngine();
      
      // Start background monitoring
      this.startPipelineMonitoring();
      this.startPerformanceOptimization();
      this.startForecastingUpdates();
      
      this.logger.info('Sales Pipeline Management System initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize Sales Pipeline Management System: ${error}`);
      throw error;
    }
  }

  /**
   * Create and manage sales opportunity
   */
  public async createSalesOpportunity(
    prospectId: string,
    opportunityData: {
      name: string;
      description: string;
      source: 'inbound' | 'outbound' | 'referral' | 'partner' | 'community';
      estimatedValue: number;
      expectedCloseDate: Date;
      proposedTier: 'starter' | 'professional' | 'enterprise';
    }
  ): Promise<SalesOpportunity> {
    const opportunityId = this.generateOpportunityId();
    
    try {
      // Create opportunity with initial data
      const opportunity: SalesOpportunity = {
        opportunityId,
        prospectId,
        details: {
          name: opportunityData.name,
          description: opportunityData.description,
          source: opportunityData.source,
          createdDate: new Date(),
          expectedCloseDate: opportunityData.expectedCloseDate,
          lastActivity: new Date()
        },
        status: {
          currentStage: 'prospecting',
          stageEntryDate: new Date(),
          probability: 10, // Initial probability
          health: 'green',
          momentum: 'stable'
        },
        financial: {
          estimatedValue: opportunityData.estimatedValue,
          contractLength: 12, // Default to 12 months
          monthlyValue: opportunityData.estimatedValue / 12,
          yearOneValue: opportunityData.estimatedValue,
          lifetimeValue: opportunityData.estimatedValue * 2.5, // Estimated LTV
          proposedTier: opportunityData.proposedTier
        },
        stakeholders: [],
        competitive: {
          competitors: [],
          competitiveThreats: [],
          differentiators: [],
          riskFactors: [],
          mitigationStrategies: []
        },
        activities: [],
        forecasting: {
          bestCase: opportunityData.estimatedValue * 1.2,
          mostLikely: opportunityData.estimatedValue,
          worstCase: opportunityData.estimatedValue * 0.8,
          confidenceLevel: 60,
          forecastCategory: 'pipeline',
          lastUpdated: new Date()
        }
      };
      
      // Store opportunity
      this.salesOpportunities.set(opportunityId, opportunity);
      
      // Auto-assign to sales team member
      await this.assignOpportunityToSalesTeam(opportunityId);
      
      // Update pipeline metrics
      this.updatePipelineMetrics();
      
      this.logger.info(`Sales opportunity created: ${opportunityData.name} (${opportunityId}) - $${opportunityData.estimatedValue}`);
      
      return opportunity;
      
    } catch (error) {
      this.logger.error(`Failed to create sales opportunity: ${error}`);
      throw error;
    }
  }

  /**
   * Progress opportunity through sales stages
   */
  public async progressOpportunityStage(
    opportunityId: string,
    newStage: string,
    progressData: {
      notes: string;
      nextSteps: string[];
      documents?: string[];
      meetingOutcome?: string;
      riskFactors?: string[];
    }
  ): Promise<{
    updated: boolean;
    currentStage: string;
    probability: number;
    nextActions: string[];
  }> {
    try {
      const opportunity = this.salesOpportunities.get(opportunityId);
      if (!opportunity) {
        throw new Error(`Opportunity not found: ${opportunityId}`);
      }
      
      // Validate stage progression
      const stageValidation = await this.validateStageProgression(opportunity, newStage);
      if (!stageValidation.valid) {
        throw new Error(`Invalid stage progression: ${stageValidation.reason}`);
      }
      
      // Update opportunity stage
      const previousStage = opportunity.status.currentStage;
      opportunity.status.currentStage = newStage;
      opportunity.status.stageEntryDate = new Date();
      opportunity.details.lastActivity = new Date();
      
      // Update probability based on new stage
      opportunity.status.probability = await this.calculateStageProbability(opportunity, newStage);
      
      // Add activity record
      opportunity.activities.push({
        activityId: this.generateActivityId(),
        type: 'follow_up',
        date: new Date(),
        attendees: ['sales_rep'],
        outcome: `Progressed from ${previousStage} to ${newStage}. ${progressData.notes}`,
        nextSteps: progressData.nextSteps,
        documents: progressData.documents || []
      });
      
      // Update risk factors if provided
      if (progressData.riskFactors) {
        opportunity.competitive.riskFactors = [...opportunity.competitive.riskFactors, ...progressData.riskFactors];
      }
      
      // Generate automated next actions
      const nextActions = await this.generateNextActions(opportunity, newStage);
      
      // Update forecasting data
      await this.updateOpportunityForecasting(opportunity);
      
      // Store updated opportunity
      this.salesOpportunities.set(opportunityId, opportunity);
      
      // Update pipeline metrics
      this.updatePipelineMetrics();
      
      this.logger.info(`Opportunity progressed: ${opportunityId} from ${previousStage} to ${newStage}`);
      
      return {
        updated: true,
        currentStage: newStage,
        probability: opportunity.status.probability,
        nextActions
      };
      
    } catch (error) {
      this.logger.error(`Failed to progress opportunity stage: ${error}`);
      throw error;
    }
  }

  /**
   * Optimize pipeline performance
   */
  public async optimizePipelinePerformance(): Promise<{
    optimizations: Array<{
      area: string;
      issue: string;
      recommendation: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
    }>;
    projectedImprovements: {
      winRateIncrease: number;
      cycleTimeReduction: number;
      pipelineValueIncrease: number;
      productivityGain: number;
    };
  }> {
    try {
      // Analyze pipeline bottlenecks
      const bottleneckAnalysis = await this.analyzePipelineBottlenecks();
      
      // Identify performance optimization opportunities
      const optimizationOpportunities = await this.identifyPerformanceOptimizations();
      
      // Generate optimization recommendations
      const optimizationRecommendations = await this.generateOptimizationRecommendations(optimizationOpportunities);
      
      // Project improvement impact
      const projectedImprovements = await this.projectOptimizationImpact(optimizationRecommendations);
      
      // Execute high-impact optimizations
      await this.executeOptimizations(optimizationRecommendations.filter(o => o.impact === 'high'));
      
      this.logger.info(`Pipeline optimization: ${optimizationRecommendations.length} recommendations generated`);
      
      return {
        optimizations: optimizationRecommendations,
        projectedImprovements
      };
      
    } catch (error) {
      this.logger.error(`Failed to optimize pipeline performance: ${error}`);
      throw error;
    }
  }

  // Private helper methods
  
  private async initializePipelineStages(): Promise<void> {
    // Initialize standard sales pipeline stages
    const stages = [
      {
        stageId: 'prospecting',
        name: 'Prospecting',
        order: 1,
        configuration: {
          entryRequirements: ['Prospect identified', 'Initial contact made'],
          exitCriteria: ['Basic qualification completed', 'Need confirmed'],
          expectedDuration: 7,
          conversionRate: 15.0,
          keyActivities: ['Initial outreach', 'Basic qualification', 'Need assessment'],
          requiredDocuments: []
        }
      },
      {
        stageId: 'qualifying',
        name: 'Qualifying',
        order: 2,
        configuration: {
          entryRequirements: ['Need confirmed', 'Budget range identified'],
          exitCriteria: ['BANT qualified', 'Stakeholders mapped'],
          expectedDuration: 14,
          conversionRate: 35.0,
          keyActivities: ['BANT qualification', 'Stakeholder mapping', 'Pain point analysis'],
          requiredDocuments: ['Qualification notes']
        }
      },
      {
        stageId: 'demo',
        name: 'Demo/Meeting',
        order: 3,
        configuration: {
          entryRequirements: ['Qualified opportunity', 'Demo scheduled'],
          exitCriteria: ['Technical fit confirmed', 'Business case validated'],
          expectedDuration: 10,
          conversionRate: 60.0,
          keyActivities: ['Product demo', 'Technical Q&A', 'Use case validation'],
          requiredDocuments: ['Demo recording', 'Technical requirements']
        }
      },
      {
        stageId: 'proposal',
        name: 'Proposal',
        order: 4,
        configuration: {
          entryRequirements: ['Technical fit confirmed', 'Proposal requested'],
          exitCriteria: ['Proposal submitted', 'Commercial discussion initiated'],
          expectedDuration: 7,
          conversionRate: 45.0,
          keyActivities: ['Proposal creation', 'Commercial discussion', 'Implementation planning'],
          requiredDocuments: ['Formal proposal', 'Implementation plan']
        }
      },
      {
        stageId: 'negotiation',
        name: 'Negotiation',
        order: 5,
        configuration: {
          entryRequirements: ['Proposal submitted', 'Commercial negotiation started'],
          exitCriteria: ['Contract agreed', 'Legal review completed'],
          expectedDuration: 21,
          conversionRate: 75.0,
          keyActivities: ['Contract negotiation', 'Legal review', 'Final approvals'],
          requiredDocuments: ['Contract draft', 'Legal approvals']
        }
      },
      {
        stageId: 'closed_won',
        name: 'Closed Won',
        order: 6,
        configuration: {
          entryRequirements: ['Contract signed', 'Payment terms agreed'],
          exitCriteria: ['Customer onboarded', 'Success team engaged'],
          expectedDuration: 0,
          conversionRate: 100.0,
          keyActivities: ['Contract signing', 'Customer onboarding handoff'],
          requiredDocuments: ['Signed contract', 'Onboarding plan']
        }
      }
    ];
    
    for (const stageData of stages) {
      const stage: PipelineStage = {
        ...stageData,
        automation: {
          autoProgressRules: [],
          notifications: [],
          followUpTasks: []
        },
        performance: {
          averageTimeInStage: stageData.configuration.expectedDuration,
          conversionRate: stageData.configuration.conversionRate,
          dropOffRate: 100 - stageData.configuration.conversionRate,
          velocityTrend: 'stable'
        }
      };
      
      this.pipelineStages.set(stageData.stageId, stage);
    }
  }

  private async initializeOpportunityScoring(): Promise<void> {
    // Initialize ML-based opportunity scoring
    this.opportunityScoringEngine = {
      scoringFactors: {
        companyFit: {
          weight: 0.25,
          factors: ['company_size', 'industry', 'revenue', 'growth_stage']
        },
        needUrgency: {
          weight: 0.20,
          factors: ['pain_intensity', 'timeline', 'consequences']
        },
        budgetAuthority: {
          weight: 0.20,
          factors: ['budget_confirmed', 'authority_level', 'procurement_process']
        },
        stakeholderEngagement: {
          weight: 0.15,
          factors: ['champion_identified', 'decision_makers_engaged', 'user_adoption']
        },
        technicalFit: {
          weight: 0.10,
          factors: ['technical_requirements', 'integration_complexity', 'security_compliance']
        },
        competitivePosition: {
          weight: 0.10,
          factors: ['competitive_threats', 'differentiation', 'previous_vendor_experience']
        }
      }
    };
  }

  private async initializePipelineHealthMonitoring(): Promise<void> {
    // Initialize pipeline health monitoring
    this.pipelineHealthMonitor = {
      healthIndicators: {
        velocity: {
          metric: 'dollars_per_day',
          threshold: 5000,
          trend: 'should_increase'
        },
        conversion: {
          metric: 'stage_conversion_rates',
          thresholds: {
            'prospecting': 10.0,
            'qualifying': 30.0,
            'demo': 50.0,
            'proposal': 40.0,
            'negotiation': 70.0
          }
        },
        aging: {
          metric: 'days_in_stage',
          thresholds: {
            'prospecting': 14,
            'qualifying': 21,
            'demo': 14,
            'proposal': 14,
            'negotiation': 30
          }
        }
      }
    };
  }

  private async initializeSalesTeam(): Promise<void> {
    // Initialize sales team members
    const teamMembers = [
      {
        memberId: 'ae_001',
        name: 'Sarah Martinez',
        email: 'sarah@openconductor.ai',
        role: 'ae',
        quota: 1200000,
        attainment: 78.5
      },
      {
        memberId: 'ae_002', 
        name: 'Michael Chen',
        email: 'michael@openconductor.ai',
        role: 'enterprise_ae',
        quota: 2000000,
        attainment: 82.1
      },
      {
        memberId: 'sdr_001',
        name: 'Jessica Thompson',
        email: 'jessica@openconductor.ai',
        role: 'sdr',
        quota: 500000,
        attainment: 65.3
      }
    ];
    
    for (const memberData of teamMembers) {
      const member: SalesTeamMember = {
        memberId: memberData.memberId,
        name: memberData.name,
        email: memberData.email,
        role: memberData.role as any,
        performance: {
          quota: memberData.quota,
          attainment: memberData.attainment,
          activitiesPerWeek: 45,
          callsPerWeek: 25,
          meetingsPerWeek: 8,
          demosPerWeek: 4,
          activeOpportunities: 12,
          pipelineValue: 450000,
          averageDealSize: 37500,
          winRate: 28.5,
          salesCycleLength: 85,
          responseTime: 2.5,
          followUpConsistency: 87.2,
          crmUsage: 92.1,
          activityLogging: 89.6
        },
        assignments: {
          territories: ['north_america'],
          accounts: [],
          opportunities: [],
          monthlyTarget: memberData.quota / 12,
          quarterlyTarget: memberData.quota / 4
        },
        development: {
          strengths: ['relationship_building', 'technical_knowledge'],
          improvementAreas: ['objection_handling', 'closing_techniques'],
          trainingCompleted: ['sales_methodology', 'product_training'],
          certifications: ['salesforce_certified'],
          coachingNotes: []
        }
      };
      
      this.salesTeam.set(memberData.memberId, member);
    }
  }

  private async initializeForecastingEngine(): Promise<void> {
    // Initialize AI-powered sales forecasting
    this.forecastingEngine = {
      models: {
        opportunityScoring: 'gradient_boosting',
        stageProgression: 'markov_chain',
        seasonalAdjustment: 'time_series',
        teamPerformance: 'regression_analysis'
      },
      features: [
        'opportunity_age',
        'stage_progression_velocity',
        'stakeholder_engagement',
        'competitive_intensity',
        'deal_size_category',
        'source_channel',
        'rep_performance',
        'seasonal_factors'
      ]
    };
  }

  // Background task implementations
  
  private startPipelineMonitoring(): void {
    this.pipelineMonitoringInterval = setInterval(async () => {
      await this.monitorPipelineHealth();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  private startPerformanceOptimization(): void {
    this.performanceOptimizationInterval = setInterval(async () => {
      await this.optimizePipelinePerformance();
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }

  private startForecastingUpdates(): void {
    this.forecastingUpdateInterval = setInterval(async () => {
      await this.updateSalesForecasting();
    }, 60 * 60 * 1000); // Every hour
  }

  // Utility methods
  private generateOpportunityId(): string {
    return `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActivityId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updatePipelineMetrics(): void {
    // Update pipeline health metrics based on current data
    this.pipelineMetrics.health.totalOpportunities = this.salesOpportunities.size;
    this.pipelineMetrics.health.totalValue = Array.from(this.salesOpportunities.values())
      .reduce((sum, opp) => sum + opp.financial.estimatedValue, 0);
    this.pipelineMetrics.health.averageOpportunityValue = 
      this.pipelineMetrics.health.totalValue / this.pipelineMetrics.health.totalOpportunities;
  }

  // Public API methods
  
  public getPipelineMetrics(): PipelineMetrics {
    return { ...this.pipelineMetrics };
  }

  public getSalesOpportunities(): SalesOpportunity[] {
    return Array.from(this.salesOpportunities.values());
  }

  public getSalesTeam(): SalesTeamMember[] {
    return Array.from(this.salesTeam.values());
  }

  public getPipelineStages(): PipelineStage[] {
    return Array.from(this.pipelineStages.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get comprehensive pipeline dashboard
   */
  public async getPipelineDashboard(): Promise<{
    overview: {
      totalOpportunities: number;
      totalValue: number;
      averageOpportunitySize: number;
      conversionRate: number;
      averageSalesCycle: number;
    };
    stageAnalysis: Array<{
      stage: string;
      count: number;
      value: number;
      conversionRate: number;
      averageTimeInStage: number;
    }>;
    teamPerformance: Array<{
      member: string;
      role: string;
      quotaAttainment: number;
      pipelineValue: number;
      activeOpportunities: number;
    }>;
    forecast: {
      thisQuarter: number;
      nextQuarter: number;
      confidence: number;
      upside: number;
      risks: string[];
    };
    alerts: Array<{
      type: 'opportunity' | 'stage' | 'team' | 'forecast';
      severity: 'high' | 'medium' | 'low';
      message: string;
      action: string;
    }>;
  }> {
    // Generate comprehensive pipeline dashboard
    const opportunities = Array.from(this.salesOpportunities.values());
    const stages = this.getPipelineStages();
    
    const dashboard = {
      overview: {
        totalOpportunities: this.pipelineMetrics.health.totalOpportunities,
        totalValue: this.pipelineMetrics.health.totalValue,
        averageOpportunitySize: this.pipelineMetrics.health.averageOpportunityValue,
        conversionRate: 23.5, // Overall win rate
        averageSalesCycle: 89
      },
      stageAnalysis: stages.map(stage => {
        const stageOpps = opportunities.filter(o => o.status.currentStage === stage.stageId);
        return {
          stage: stage.name,
          count: stageOpps.length,
          value: stageOpps.reduce((sum, o) => sum + o.financial.estimatedValue, 0),
          conversionRate: stage.performance.conversionRate,
          averageTimeInStage: stage.performance.averageTimeInStage
        };
      }),
      teamPerformance: Array.from(this.salesTeam.values()).map(member => ({
        member: member.name,
        role: member.role,
        quotaAttainment: member.performance.attainment,
        pipelineValue: member.performance.pipelineValue,
        activeOpportunities: member.performance.activeOpportunities
      })),
      forecast: {
        thisQuarter: this.pipelineMetrics.forecasting.currentQuarter.forecast,
        nextQuarter: this.pipelineMetrics.forecasting.nextQuarter.forecast,
        confidence: this.pipelineMetrics.forecasting.nextQuarter.confidence,
        upside: this.pipelineMetrics.forecasting.nextQuarter.upside,
        risks: [
          'Long sales cycles impacting Q4 close timing',
          'Competition intensifying in enterprise segment', 
          'Budget freezes affecting enterprise deals',
          'Resource constraints in sales team'
        ]
      },
      alerts: [
        {
          type: 'opportunity' as const,
          severity: 'high' as const,
          message: '5 opportunities have been in negotiation stage for >30 days',
          action: 'Review and accelerate closing activities'
        },
        {
          type: 'team' as const,
          severity: 'medium' as const,
          message: '1 sales team member below 70% quota attainment',
          action: 'Provide coaching and support'
        },
        {
          type: 'forecast' as const,
          severity: 'medium' as const,
          message: 'Q4 forecast confidence at 78% - below 85% target',
          action: 'Strengthen pipeline and improve opportunity quality'
        }
      ]
    };
    
    return dashboard;
  }
}

export default SalesPipelineManagementSystem;